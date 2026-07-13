import { counters } from "../../../db/schema.js";
import { eq, sql } from "drizzle-orm";
import type { DB } from "../../../db/index.js";

// Row-locked continuous serial, never resets — M4 spec. Must be called inside an
// existing transaction (tx) so the counter increment is atomic with whatever else
// that transaction does (creating the proforma/invoice row itself).
export async function getNextNumber(tx: DB, counterKey: "INV" | "PRO"): Promise<string> {
  const [row] = await tx
    .select()
    .from(counters)
    .where(eq(counters.counterKey, counterKey))
    .for("update");

  if (!row) throw new Error(`COUNTER_NOT_SEEDED: ${counterKey}`);

  const nextValue = row.currentValue + 1;
  await tx
    .update(counters)
    .set({ currentValue: nextValue })
    .where(eq(counters.counterKey, counterKey));

  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const serial = String(nextValue).padStart(4, "0"); // grows past 4 digits naturally, never truncates

  return `${counterKey}-${yyyymm}-${serial}`;
}
