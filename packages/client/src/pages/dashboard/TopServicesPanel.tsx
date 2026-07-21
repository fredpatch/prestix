import type { CaCompositionResult } from "@/lib/reporting.api";
import { fmt } from "./format";

interface TopServicesPanelProps {
  composition: CaCompositionResult;
}

export function TopServicesPanel({ composition }: TopServicesPanelProps) {
  const rows = [...composition.buckets].sort((a, b) => b.gross - a.gross).slice(0, 5);
  const total = composition.totalGross || 1;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <p className="text-[13px] font-semibold text-neutral-900">Top services</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">Classés par CA brut.</p>
      </div>
      <div className="divide-y divide-neutral-100">
        {rows.map((row) => {
          const share = Math.round((row.gross / total) * 100);
          return (
            <div key={row.bucketKey} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-neutral-800">{row.label}</p>
                  <p className="mt-0.5 text-[10.5px] text-neutral-500">
                    {row.volume} opération{row.volume > 1 ? "s" : ""} · {fmt(row.gain)} XAF gain
                  </p>
                </div>
                <p className="text-right text-[12px] font-bold tabular-nums text-neutral-900">
                  {fmt(row.gross)}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full bg-brand-gold-dark" style={{ width: `${share}%` }} />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-[12px] text-neutral-500">
            Aucun service sur la période.
          </p>
        )}
      </div>
    </section>
  );
}
