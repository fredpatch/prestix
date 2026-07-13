import { db } from "../../../db/index.js";
import { parties } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import type { PartyHistoryFilters, PartyHistoryResult } from "./party-history.types.js";

// Scaffold only (Sprint 2 / M3). Commercial section wires up in Sprint 3 once `invoices`
// exists (M4); épargne section wires up in Sprint 9 once `savings_transactions` exists
// (M11). Response SHAPE is final now — commercial/épargne always separate, always
// independently paginated (?page= vs ?epargnePage=) per the M3 spec. Only the query
// bodies are pending; callers written against this contract today won't need to change
// when the real data lands.
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

  return {
    // TODO (Sprint 3 / M4): query `invoices` where buyerPartyId = partyId, ordered desc,
    // paginated by page/pageSize.
    commercial: { data: [], total: 0, page, pageSize },

    // TODO (Sprint 9 / M11): query `savings_transactions` joined to `savings_accounts`
    // where partyId = partyId, ordered desc, paginated by epargnePage/epargnePageSize.
    epargne: { data: [], total: 0, page: epargnePage, pageSize: epargnePageSize },
  };
}
