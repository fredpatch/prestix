import { db } from "../../../db/index.js";
import { proformas, proformaLines, parties, users, roleLevel } from "../../../db/schema.js";
import { eq, and, lt } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { getNextNumber } from "./counters.service.js";
import type { CreateProformaParams, ProformaView } from "./proforma.types.js";

const PROFORMA_VALIDITY_HOURS = 48;

function lineTotal(unitPrice: number, quantity: number, discount: number): number {
  return unitPrice * quantity - discount;
}

async function assertCanDiscount(userId: number, lines: { discount?: number }[]): Promise<void> {
  const hasDiscount = lines.some((l) => (l.discount ?? 0) > 0);
  if (!hasDiscount) return;
  const [actor] = await db.select().from(users).where(eq(users.id, userId));
  if (!actor || roleLevel[actor.role] < roleLevel.manager) {
    throw new Error("DISCOUNT_REQUIRES_MANAGER");
  }
}

async function toView(
  p: typeof proformas.$inferSelect,
  lines: (typeof proformaLines.$inferSelect)[],
): Promise<ProformaView> {
  return {
    id: p.id,
    number: p.number,
    partyId: p.partyId,
    partySnapshot: p.partySnapshot as Record<string, unknown>,
    status: p.status,
    expiresAt: p.expiresAt ?? undefined,
    createdAt: p.createdAt,
    lines: lines.map((l) => ({
      id: l.id,
      lineType: l.lineType,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      lineTotal: l.lineTotal,
    })),
  };
}

// Single atomic call — party + all lines decided upfront, numbered and 48h-clocked
// immediately (M4: "proforma numbered at creation"). Unlike invoices, there's no
// separate slow draft-then-issue flow for proformas.
export async function createProforma(params: CreateProformaParams): Promise<ProformaView> {
  if (params.lines.length === 0) throw new Error("PROFORMA_NEEDS_AT_LEAST_ONE_LINE");

  // M7: discounts are manager-only. Cheap to enforce now even though the full
  // discount workflow (bounds, print summary) is Sprint 6 scope.
  await assertCanDiscount(params.createdByUserId, params.lines);

  const [party] = await db.select().from(parties).where(eq(parties.id, params.partyId));
  if (!party) throw new Error("PARTY_NOT_FOUND");

  const result = await db.transaction(async (tx: any) => {
    const number = await getNextNumber(tx, "PRO");
    const expiresAt = new Date(Date.now() + PROFORMA_VALIDITY_HOURS * 60 * 60 * 1000);

    const [proforma] = await tx
      .insert(proformas)
      .values({
        number,
        partyId: params.partyId,
        partySnapshot: { fullName: party.fullName, phone: party.phone, email: party.email },
        expiresAt,
        createdBy: params.createdByUserId,
      })
      .returning();

    const insertedLines = await tx
      .insert(proformaLines)
      .values(
        params.lines.map((l) => {
          const quantity = l.quantity ?? 1;
          const discount = l.discount ?? 0;
          return {
            proformaId: proforma.id,
            lineType: l.lineType,
            description: l.description,
            quantity,
            unitPrice: l.unitPrice.toFixed(2),
            discount: discount.toFixed(2),
            lineTotal: lineTotal(l.unitPrice, quantity, discount).toFixed(2),
          };
        }),
      )
      .returning();

    return { proforma, insertedLines };
  });

  await logAudit({
    userId: params.createdByUserId,
    action: "PROFORMA_CREATED",
    entityType: "proformas",
    entityId: String(result.proforma.id),
    metadata: { number: result.proforma.number, partyId: params.partyId },
  });

  return toView(result.proforma, result.insertedLines);
}

export async function getProformaById(id: number): Promise<ProformaView> {
  const [proforma] = await db.select().from(proformas).where(eq(proformas.id, id));
  if (!proforma) throw new Error("PROFORMA_NOT_FOUND");
  const lines = await db.select().from(proformaLines).where(eq(proformaLines.proformaId, id));
  return toView(proforma, lines);
}

export async function listProformas(partyId?: number): Promise<ProformaView[]> {
  const rows = partyId
    ? await db.select().from(proformas).where(eq(proformas.partyId, partyId))
    : await db.select().from(proformas);

  const results: ProformaView[] = [];
  for (const p of rows) {
    const lines = await db.select().from(proformaLines).where(eq(proformaLines.proformaId, p.id));
    results.push(await toView(p, lines));
  }
  return results;
}

// For the expiry cron (node-cron, wired in jobs/index.ts) — M4: "node-cron sets
// Expirée; no auto-cancel."
export async function expireOverdueProformas(): Promise<number> {
  const result = await db
    .update(proformas)
    .set({ status: "expired" })
    .where(and(eq(proformas.status, "draft"), lt(proformas.expiresAt, new Date())))
    .returning();
  return result.length;
}
