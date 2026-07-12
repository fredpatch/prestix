import { db } from "../../../db/index.js";
import { settings } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import { toSettingView, validateValue } from "./settings.helpers.js";
import type { SettingType, SettingView } from "./settings.types.js";

export async function listSettings(module?: string): Promise<SettingView[]> {
  const rows = module
    ? await db.select().from(settings).where(eq(settings.module, module))
    : await db.select().from(settings);

  return rows
    .map(toSettingView)
    .sort((a, b) => a.module.localeCompare(b.module) || a.key.localeCompare(b.key));
}

export async function getSetting(key: string): Promise<SettingView> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  if (!row) throw new Error("SETTING_NOT_FOUND");
  return toSettingView(row);
}

// Used internally by other services (penalty cron, credit conversion, etc.)
export async function getIntValue(key: string, fallback: number): Promise<number> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  if (!row) return fallback;
  const n = parseInt(row.value, 10);
  return isNaN(n) ? fallback : n;
}

export async function getBoolValue(key: string, fallback: boolean): Promise<boolean> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  if (!row) return fallback;
  return row.value === "true";
}

export async function updateSetting(
  key: string,
  value: string,
  userId: number,
): Promise<SettingView> {
  const [existing] = await db.select().from(settings).where(eq(settings.key, key));
  if (!existing) throw new Error("SETTING_NOT_FOUND");

  validateValue(value, existing.type as SettingType);

  const [updated] = await db
    .update(settings)
    .set({ value, updatedBy: userId, updatedAt: new Date() })
    .where(eq(settings.key, key))
    .returning();

  await logAudit({
    userId,
    action: "SETTING_UPDATED",
    entityType: "settings",
    entityId: String(updated.id),
    metadata: { key, oldValue: existing.value, newValue: value },
  });

  return toSettingView(updated);
}
