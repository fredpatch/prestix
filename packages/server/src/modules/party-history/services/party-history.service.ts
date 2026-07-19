import { db } from "../../../db/index.js";
import { parties, savingsAccounts, savingsTransactions, invoices, proformas, proformaLines } from "../../../db/schema.js";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import type { PartyHistoryFilters, PartyHistoryResult } from "./party-history.types.js";

// Scaffold from Sprint 2 / M3, filled in here — commercial section was a
// pre-existing gap left over from Sprint 3 (invoices/M4 existed for a long
// time before this query was ever actually written), noticed and closed
// while working through Fred's Analyse-section requests rather than a
// planned task of its own. Response SHAPE is unchanged — commercial/épargne
// always separate, always independently paginated (?page= vs ?epargnePage=)
// per the original M3 spec.
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

  // Both proformas AND invoices — "historique commercial" means every
  // commercial document involving this party, not just settled sales. A
  // proforma that was never promoted still represents real interaction with
  // the client worth showing here.
  const partyInvoices = await db.select().from(invoices).where(eq(invoices.partyId, partyId));
  const partyProformas = await db.select().from(proformas).where(eq(proformas.partyId, partyId));

  // Proformas don't carry a stored total (computed from lines at read time,
  // same as everywhere else in the app) — sum them here for the list view.
  let proformaTotals = new Map<number, number>();
  if (partyProformas.length > 0) {
    const lines = await db
      .select()
      .from(proformaLines)
      .where(inArray(proformaLines.proformaId, partyProformas.map((p) => p.id)));
    proformaTotals = new Map();
    for (const l of lines) {
      proformaTotals.set(l.proformaId, (proformaTotals.get(l.proformaId) ?? 0) + parseFloat(l.lineTotal));
    }
  }

  const commercialEntries: PartyHistoryResult["commercial"]["data"] = [
    ...partyInvoices.map((i) => ({
      id: i.id,
      docType: "invoice" as const,
      number: i.number ?? undefined,
      status: i.status,
      date: i.issuedAt ?? i.createdAt,
      amount: i.totalAmount,
    })),
    ...partyProformas.map((p) => ({
      id: p.id,
      docType: "proforma" as const,
      number: p.number,
      status: p.status,
      date: p.createdAt,
      amount: (proformaTotals.get(p.id) ?? 0).toFixed(2),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const commercialTotal = commercialEntries.length;
  const commercialStart = (page - 1) * pageSize;
  const commercialData = commercialEntries.slice(commercialStart, commercialStart + pageSize);

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
    commercial: { data: commercialData, total: commercialTotal, page, pageSize },
    epargne: { data: epargneData, total: epargneTotal, page: epargnePage, pageSize: epargnePageSize },
  };
}
