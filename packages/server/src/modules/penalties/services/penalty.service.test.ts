import { describe, it, expect } from "vitest";
import { computeExpectedAccrualCount } from "./penalty.service.js";

// M6: +2500 XAF/week, accumulating, per échéance. This suite exists specifically
// because the spec flags penalty accrual as money-critical and calls for a
// dedicated test suite with named constants, not magic numbers re-derived by hand
// each time. Every case below is anchored to the exact spec example: échéance
// missed 2026-01-01, 1-week grace → first penalty fires 2026-01-08.

describe("computeExpectedAccrualCount", () => {
  const expectedDate = new Date("2026-01-01");
  const graceWeeks = 1;

  it("accrues nothing before the grace period ends", () => {
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, new Date("2026-01-07"))).toBe(0);
  });

  it("accrues week 1 (2500 XAF) exactly on the anchor date", () => {
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, new Date("2026-01-08"))).toBe(1);
  });

  it("stays at week 1 for the rest of that week", () => {
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, new Date("2026-01-14"))).toBe(1);
  });

  it("jumps to week 2 (cumulative 5000 XAF) exactly 7 days after the anchor", () => {
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, new Date("2026-01-15"))).toBe(2);
  });

  it("jumps to week 3 (cumulative 7500 XAF) exactly 14 days after the anchor", () => {
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, new Date("2026-01-22"))).toBe(3);
  });

  it("keeps accumulating indefinitely — no cap in the spec", () => {
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, new Date("2026-03-01"))).toBe(8);
  });

  it("respects a longer grace period (2 weeks) by shifting the anchor, not the cadence", () => {
    expect(computeExpectedAccrualCount(expectedDate, 2, new Date("2026-01-08"))).toBe(0); // still within 2-week grace
    expect(computeExpectedAccrualCount(expectedDate, 2, new Date("2026-01-15"))).toBe(1); // anchor = Jan 15
    expect(computeExpectedAccrualCount(expectedDate, 2, new Date("2026-01-22"))).toBe(2); // still weekly from there
  });

  it("is exact at midnight boundaries — no off-by-one from time-of-day", () => {
    const morning = new Date("2026-01-15T00:00:01");
    const evening = new Date("2026-01-15T23:59:59");
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, morning)).toBe(2);
    expect(computeExpectedAccrualCount(expectedDate, graceWeeks, evening)).toBe(2);
  });
});
