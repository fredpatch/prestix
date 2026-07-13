// node-cron job registry. Examples to come: proforma 48h expiry (S3),
// penalty accrual (S5), credit-window auto-conversion (S9).
import cron from "node-cron";
import { expireOverdueProformas } from "../modules/documents/services/proforma.service.js";

// M4: proforma 48h expiry — runs every 15 minutes, flips overdue drafts to `expired`.
// No auto-cancel, just status — matches spec exactly.
export function registerJobs(): void {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const count = await expireOverdueProformas();
      if (count > 0) console.log(`[cron] ${count} proforma(s) expired`);
    } catch (err) {
      console.error("[cron] proforma expiry failed:", err);
    }
  });

  // Penalty accrual (S5), credit-window auto-conversion (S9) register here later.
}
