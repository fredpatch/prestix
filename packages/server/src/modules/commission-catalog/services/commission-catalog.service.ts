import { db } from "../../../db/index.js";
import { commissionTypeCatalog } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import type {
  CommissionTypeView,
  CreateCommissionTypeParams,
  UpdateCommissionTypeParams,
} from "./commission-catalog.types.js";

function toView(c: typeof commissionTypeCatalog.$inferSelect): CommissionTypeView {
  return {
    id: c.id,
    code: c.code,
    label: c.label,
    icon: c.icon ?? undefined,
    active: c.active,
    fieldSchema: c.fieldSchema ?? undefined,
    createdAt: c.createdAt,
  };
}

export async function listCommissionTypes(includeInactive = true): Promise<CommissionTypeView[]> {
  const rows = includeInactive
    ? await db.select().from(commissionTypeCatalog).orderBy(commissionTypeCatalog.label)
    : await db
        .select()
        .from(commissionTypeCatalog)
        .where(eq(commissionTypeCatalog.active, true))
        .orderBy(commissionTypeCatalog.label);
  return rows.map(toView);
}

export async function createCommissionType(
  params: CreateCommissionTypeParams,
): Promise<CommissionTypeView> {
  const [existing] = await db
    .select()
    .from(commissionTypeCatalog)
    .where(eq(commissionTypeCatalog.code, params.code));
  if (existing) throw new Error("CODE_ALREADY_EXISTS");

  const [created] = await db
    .insert(commissionTypeCatalog)
    .values({
      code: params.code,
      label: params.label,
      icon: params.icon,
      fieldSchema: params.fieldSchema,
      active: true,
    })
    .returning();

  await logAudit({
    userId: params.createdByUserId,
    action: "COMMISSION_TYPE_CREATED",
    entityType: "commission_type_catalog",
    entityId: String(created.id),
    metadata: { code: created.code },
  });

  return toView(created);
}

export async function updateCommissionType(
  code: string,
  params: UpdateCommissionTypeParams,
): Promise<CommissionTypeView> {
  const [existing] = await db
    .select()
    .from(commissionTypeCatalog)
    .where(eq(commissionTypeCatalog.code, code));
  if (!existing) throw new Error("TYPE_NOT_FOUND");

  const updates: Partial<typeof commissionTypeCatalog.$inferInsert> = {};
  if (params.label !== undefined) updates.label = params.label;
  if (params.icon !== undefined) updates.icon = params.icon;
  if (params.fieldSchema !== undefined) updates.fieldSchema = params.fieldSchema;

  const [updated] = await db
    .update(commissionTypeCatalog)
    .set(updates)
    .where(eq(commissionTypeCatalog.code, code))
    .returning();

  await logAudit({
    userId: params.updatedByUserId,
    action: "COMMISSION_TYPE_UPDATED",
    entityType: "commission_type_catalog",
    entityId: String(updated.id),
    metadata: { code, ...updates },
  });

  return toView(updated);
}

// Soft-disable / re-enable only — no delete endpoint exists anywhere in this module.
// Existing transactions keep their type even when disabled (edge case decision, M2).
export async function toggleCommissionTypeActive(
  code: string,
  active: boolean,
  userId: number,
): Promise<CommissionTypeView> {
  const [existing] = await db
    .select()
    .from(commissionTypeCatalog)
    .where(eq(commissionTypeCatalog.code, code));
  if (!existing) throw new Error("TYPE_NOT_FOUND");

  const [updated] = await db
    .update(commissionTypeCatalog)
    .set({ active })
    .where(eq(commissionTypeCatalog.code, code))
    .returning();

  await logAudit({
    userId,
    action: active ? "COMMISSION_TYPE_ENABLED" : "COMMISSION_TYPE_DISABLED",
    entityType: "commission_type_catalog",
    entityId: String(updated.id),
    metadata: { code },
  });

  return toView(updated);
}
