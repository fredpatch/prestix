import { db } from "../../../db/index.js";
import { savingsAccounts, savingsTransactions, creditLots } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { getIntValue, getStringValue } from "../../settings/services/settings.service.js";
import { listExpiredUnconvertedLots } from "../../credit/services/credit.service.js";
import { logAudit } from "../../auth/services/auth.service.js";

// M3+M11: a credit lot whose decision window has expired, still holding a
// balance, auto-converts to épargne. Two real branches this function has to
// get right:
//
// 1. Party has NO savings account yet → this conversion IS the subscription.
//    Inscription fee gets deducted from the credit amount (spec: "fee once
//    per party"); the remainder becomes the account's opening deposit.
// 2. Party ALREADY has an account → no second fee (one per party, ever) —
//    the ENTIRE remaining credit becomes a straight deposit into the
//    existing account.
//
// CREDIT_UNDERFEE_POLICY (default HOLD_AND_NOTIFY) governs what happens when
// branch 1 applies but the credit is smaller than the fee itself — rather
// than open an account with a negative or zero opening balance, the lot is
// left untouched and flagged for manual review.
export async function convertExpiredCreditLots(): Promise<{ converted: number; heldForReview: number }> {
  const expiredLots = await listExpiredUnconvertedLots();
  let converted = 0;
  let heldForReview = 0;

  for (const lot of expiredLots) {
    const remaining = parseFloat(lot.remainingAmount);
    if (remaining <= 0) continue; // shouldn't happen given the query's own filter, defensive only

    const [existingAccount] = await db
      .select()
      .from(savingsAccounts)
      .where(eq(savingsAccounts.partyId, lot.partyId));

    if (existingAccount) {
      // Branch 2 — no fee, straight deposit of the whole remaining amount.
      await db.transaction(async (tx: any) => {
        await tx.insert(savingsTransactions).values({
          accountId: existingAccount.id,
          nature: "deposit",
          amount: remaining.toFixed(2),
          quantity: 1,
          totalAmount: remaining.toFixed(2),
          status: "recorded",
          agentId: null,
          recordedAt: new Date(),
        });
        await tx.update(creditLots).set({ convertedAt: new Date() }).where(eq(creditLots.id, lot.id));
      });

      await logAudit({
        // system action — no human agent, omit userId entirely (logAudit's param is optional)
        action: "CREDIT_AUTO_CONVERTED_TO_EPARGNE_DEPOSIT",
        entityType: "credit_lots",
        entityId: String(lot.id),
        metadata: { accountId: existingAccount.id, amount: remaining },
      });
      converted++;
      continue;
    }

    // Branch 1 — no account yet. Check the underfee policy before opening one.
    const feeAmount = await getIntValue("epargne_inscription_fee", 5000);

    if (remaining < feeAmount) {
      const policy = await getStringValue("credit_underfee_policy", "HOLD_AND_NOTIFY");
      // Only one policy value exists today (HOLD_AND_NOTIFY) — this branch is
      // written to make room for a future policy without needing a rewrite,
      // not because a second policy exists yet.
      if (policy === "HOLD_AND_NOTIFY") {
        // System action — no human agent, userId omitted (logAudit's param is optional)
        await logAudit({
          action: "CREDIT_UNDERFEE_HELD_FOR_REVIEW",
          entityType: "credit_lots",
          entityId: String(lot.id),
          metadata: { remaining, feeAmount, policy },
        });
        heldForReview++;
      }
      continue; // lot stays unconverted either way under the only policy that exists
    }

    const openingDeposit = remaining - feeAmount;

    await db.transaction(async (tx: any) => {
      const [account] = await tx
        .insert(savingsAccounts)
        .values({
          partyId: lot.partyId,
          currency: "XAF",
          inscriptionFeeAmount: feeAmount.toFixed(2),
          subscriptionSource: "credit_conversion",
          sourceCreditLotId: lot.id,
        })
        .returning();

      const now = new Date();

      // Same visible fee trail as direct subscription (savings.service.ts) —
      // the FULL remaining credit lands as a deposit, then the fee is taken
      // back out as its own withdrawal, rather than silently only ever
      // depositing the fee-reduced remainder. Consistent accounting
      // regardless of which of the two entry paths opened the account.
      await tx.insert(savingsTransactions).values({
        accountId: account.id,
        nature: "deposit",
        amount: remaining.toFixed(2),
        quantity: 1,
        totalAmount: remaining.toFixed(2),
        status: "recorded",
        agentId: null,
        recordedAt: now,
      });
      await tx.insert(savingsTransactions).values({
        accountId: account.id,
        nature: "withdraw",
        amount: feeAmount.toFixed(2),
        quantity: 1,
        totalAmount: feeAmount.toFixed(2),
        status: "recorded",
        agentId: null,
        recordedAt: now,
      });

      await tx.update(creditLots).set({ convertedAt: new Date() }).where(eq(creditLots.id, lot.id));
    });

    // System action — no human agent, userId omitted
    await logAudit({
      action: "CREDIT_AUTO_CONVERTED_TO_EPARGNE_SUBSCRIPTION",
      entityType: "credit_lots",
      entityId: String(lot.id),
      metadata: { partyId: lot.partyId, feeAmount, openingDeposit },
    });
    converted++;
  }

  return { converted, heldForReview };
}
