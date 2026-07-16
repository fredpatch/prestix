// node-cron job registry. Examples to come: proforma 48h expiry (S3),
// penalty accrual (S5), credit-window auto-conversion (S9).
import cron from "node-cron";
import { expireOverdueProformas } from "../modules/documents/services/proforma.service.js";
import { accrueOverduePenalties } from "@/modules/penalties/services/penalty.service.js";
import { convertExpiredCreditLots } from "@/modules/savings/services/savings-conversion.service.js";

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

  // M6: penalty accrual — runs once daily at 00:05. Money-critical, no
  // manual waiver possible anywhere else in the system — this cron and
  // cancellation (voidPenaltiesForInvoice) are the only two paths that ever
  // touch a penalty row after creation.
  cron.schedule("5 0 * * *", async () => {
    try {
      const count = await accrueOverduePenalties();
      if (count > 0) console.log(`[cron] ${count} penalty row(s) accrued`);
    } catch (err) {
      console.error("[cron] penalty accrual failed:", err);
    }
  });

  // Credit-window auto-conversion (S9) — runs once daily at 00:10, right
  // after penalty accrual. A credit lot's decision window expiring is a
  // similarly money-adjacent event; same daily cadence is appropriate, no
  // need for tighter polling.
  cron.schedule("10 0 * * *", async () => {
    try {
      const { converted, heldForReview } = await convertExpiredCreditLots();
      if (converted > 0 || heldForReview > 0) {
        console.log(`[cron] ${converted} credit lot(s) auto-converted, ${heldForReview} held for review`);
      }
    } catch (err) {
      console.error("[cron] credit-window auto-conversion failed:", err);
    }
  });
}
