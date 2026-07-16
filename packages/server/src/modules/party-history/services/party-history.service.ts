import { db } from "../../../db/index.js";
import { parties, savingsAccounts, savingsTransactions } from "../../../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import type { PartyHistoryFilters, PartyHistoryResult } from "./party-history.types.js";

// Scaffold only (Sprint 2 / M3). Commercial section wires up in Sprint 3 once `invoices`
// exists (M4); épargne section wires up in Sprint 9 once `savings_transactions` exists
// (M11). Response SHAPE is final now — commercial/épargne always separate, always
// independently paginated (?page= vs ?epargnePage=) per the M3 spec. Only the query
// bodies are pending; callers written against this contract today won't need to change
// when the real data lands.
//
// NOTE (Sprint 9): the commercial section's query is STILL a TODO below — that's a
// pre-existing Sprint 3 gap, not something this sprint touches. Only épargne is filled
// in here, matching M11's actual scope.
export async function getPartyHistory(
  partyId: number,
  filters: PartyHistoryFilters,
): Promise<PartyHistoryResult> {
  const [party] = await db.select().from(parties).where(eq(parties.id, partyId));
  if (!party) throw new Error("PARTY_NOT_FOUND");

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const epargnePage = filters.epargnePage ?? 1;
  const epargnePageSize = filters.epargnePageSize ?? 20;

  // savings_transactions has no partyId column of its own — it only knows its
  // accountId, and an account belongs to a party. Join through
  // savings_accounts rather than duplicate partyId onto every ledger row.
  const [account] = await db.select().from(savingsAccounts).where(eq(savingsAccounts.partyId, partyId));

  let epargneData: PartyHistoryResult["epargne"]["data"] = [];
  let epargneTotal = 0;

  if (account) {
    const allRows = await db
      .select()
      .from(savingsTransactions)
      .where(eq(savingsTransactions.accountId, account.id))
      .orderBy(desc(savingsTransactions.createdAt));

    epargneTotal = allRows.length;
    const start = (epargnePage - 1) * epargnePageSize;
    epargneData = allRows.slice(start, start + epargnePageSize).map((r) => ({
      id: r.id,
      nature: r.nature,
      totalAmount: r.totalAmount,
      status: r.status,
      receiptNumber: r.receiptNumber ?? undefined,
      reversalOfTransactionId: r.reversalOfTransactionId ?? undefined,
      appliedToInvoiceId: r.appliedToInvoiceId ?? undefined,
      recordedAt: r.recordedAt ?? undefined,
    }));
  }

  return {
    // TODO (Sprint 3 / M4, still pending — pre-existing gap, not part of Sprint 9):
    // query `invoices` where buyerPartyId = partyId, ordered desc, paginated by
    // page/pageSize.
    commercial: { data: [], total: 0, page, pageSize },

    epargne: { data: epargneData, total: epargneTotal, page: epargnePage, pageSize: epargnePageSize },
  };
}
