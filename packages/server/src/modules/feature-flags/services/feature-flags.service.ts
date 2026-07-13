import { db } from "../../../db/index.js";
import { featureFlags } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { logAudit } from "../../auth/services/auth.service.js";
import type { FeatureFlagView } from "./feature-flags.types.js";

function toView(f: typeof featureFlags.$inferSelect): FeatureFlagView {
  return { id: f.id, moduleCode: f.moduleCode, enabled: f.enabled };
}

export async function listFeatureFlags(): Promise<FeatureFlagView[]> {
  const rows = await db.select().from(featureFlags).orderBy(featureFlags.moduleCode);
  return rows.map(toView);
}

export async function toggleFeatureFlag(
  moduleCode: string,
  enabled: boolean,
  userId: number,
): Promise<FeatureFlagView> {
  const [existing] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.moduleCode, moduleCode));
  if (!existing) throw new Error("FLAG_NOT_FOUND");

  const [updated] = await db
    .update(featureFlags)
    .set({ enabled })
    .where(eq(featureFlags.moduleCode, moduleCode))
    .returning();

  await logAudit({
    userId,
    action: enabled ? "FEATURE_FLAG_ENABLED" : "FEATURE_FLAG_DISABLED",
    entityType: "feature_flags",
    entityId: String(updated.id),
    metadata: { moduleCode },
  });

  return toView(updated);
}
