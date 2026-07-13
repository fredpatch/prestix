import { db } from "../../../db/index.js";
import { parties } from "../../../db/schema.js";
import { eq, ilike, or, and, count } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import type {
  CreatePartyParams,
  PartyFilters,
  PartyView,
  UpdatePartyParams,
} from "./party.types.js";

function toView(p: typeof parties.$inferSelect): PartyView {
  return {
    id: p.id,
    code: p.code ?? undefined,
    fullName: p.fullName,
    isClient: p.isClient,
    isReferrer: p.isReferrer,
    phone: p.phone ?? undefined,
    email: p.email ?? undefined,
    address: p.address ?? undefined,
    active: p.active,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function listParties(
  filters: PartyFilters,
): Promise<{ data: PartyView[]; total: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filters.search) {
    conditions.push(
      or(
        ilike(parties.fullName, `%${filters.search}%`),
        ilike(parties.email, `%${filters.search}%`),
        ilike(parties.phone, `%${filters.search}%`),
        ilike(parties.code, `%${filters.search}%`),
      ),
    );
  }
  if (filters.isClient !== undefined) conditions.push(eq(parties.isClient, filters.isClient));
  if (filters.isReferrer !== undefined) conditions.push(eq(parties.isReferrer, filters.isReferrer));
  if (filters.active !== undefined) conditions.push(eq(parties.active, filters.active));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(parties)
    .where(where)
    .orderBy(parties.fullName)
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(parties).where(where);

  return { data: rows.map(toView), total };
}

export async function getPartyById(id: number): Promise<PartyView> {
  const [party] = await db.select().from(parties).where(eq(parties.id, id));
  if (!party) throw new Error("PARTY_NOT_FOUND");
  return toView(party);
}

export async function createParty(params: CreatePartyParams): Promise<PartyView> {
  if (!params.isClient && !params.isReferrer) {
    throw new Error("PARTY_NEEDS_A_ROLE"); // must be at least client or referrer (M3: can be both, never neither)
  }

  const [created] = await db
    .insert(parties)
    .values({
      code: params.code,
      fullName: params.fullName,
      isClient: params.isClient ?? false,
      isReferrer: params.isReferrer ?? false,
      phone: params.phone,
      email: params.email,
      address: params.address,
    })
    .returning();

  await logAudit({
    userId: params.createdByUserId,
    action: "PARTY_CREATED",
    entityType: "parties",
    entityId: String(created.id),
    metadata: { fullName: created.fullName },
  });

  return toView(created);
}

export async function updateParty(id: number, params: UpdatePartyParams): Promise<PartyView> {
  const [existing] = await db.select().from(parties).where(eq(parties.id, id));
  if (!existing) throw new Error("PARTY_NOT_FOUND");

  const nextIsClient = params.isClient ?? existing.isClient;
  const nextIsReferrer = params.isReferrer ?? existing.isReferrer;
  if (!nextIsClient && !nextIsReferrer) {
    throw new Error("PARTY_NEEDS_A_ROLE");
  }

  const updates: Partial<typeof parties.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (params.code !== undefined) updates.code = params.code;
  if (params.fullName !== undefined) updates.fullName = params.fullName;
  if (params.isClient !== undefined) updates.isClient = params.isClient;
  if (params.isReferrer !== undefined) updates.isReferrer = params.isReferrer;
  if (params.phone !== undefined) updates.phone = params.phone;
  if (params.email !== undefined) updates.email = params.email;
  if (params.address !== undefined) updates.address = params.address;

  const [updated] = await db.update(parties).set(updates).where(eq(parties.id, id)).returning();

  await logAudit({
    userId: params.updatedByUserId,
    action: "PARTY_UPDATED",
    entityType: "parties",
    entityId: String(updated.id),
    metadata: updates,
  });

  return toView(updated);
}

// Soft-delete only — never hard delete (methodology golden rule; snapshots preserve
// historical attribution on invoices/commissions even after a party is deactivated).
export async function toggleActivation(
  id: number,
  active: boolean,
  userId: number,
): Promise<PartyView> {
  const [existing] = await db.select().from(parties).where(eq(parties.id, id));
  if (!existing) throw new Error("PARTY_NOT_FOUND");

  const [updated] = await db
    .update(parties)
    .set({ active, updatedAt: new Date() })
    .where(eq(parties.id, id))
    .returning();

  await logAudit({
    userId,
    action: active ? "PARTY_ACTIVATED" : "PARTY_DEACTIVATED",
    entityType: "parties",
    entityId: String(updated.id),
  });

  return toView(updated);
}
