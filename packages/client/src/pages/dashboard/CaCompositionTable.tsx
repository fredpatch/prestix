import type { CaCompositionResult } from "@/lib/reporting.api";
import { fmt } from "./format";
import { cn } from "@/lib/utils";

interface CaCompositionTableProps {
  composition: CaCompositionResult;
  className?: string;
}

// CA composition - gross always shown, gain always shown, buckets dynamic
export function CaCompositionTable({ composition, className }: CaCompositionTableProps) {
  return (
    <div
      className={cn(
        "bg-white border border-neutral-200 rounded-lg overflow-hidden mb-6",
        className,
      )}
    >
      <div className="px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
        <p className="text-[11.5px] font-semibold text-neutral-800">Composition du CA</p>
        <p className="text-[10.5px] text-neutral-500">
          Factures émises uniquement - brouillons et annulées exclues
        </p>
      </div>
      <table className="w-full text-left">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
              Bucket
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
              CA Brut (XAF)
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
              Gain (XAF)
            </th>
          </tr>
        </thead>
        <tbody>
          {composition.buckets.map((b) => (
            <tr key={b.bucketKey} className="border-b border-neutral-100 last:border-0">
              <td className="px-4 py-2 text-[12px] text-neutral-800">{b.label}</td>
              <td className="px-4 py-2 text-[12px] text-neutral-500 text-right">{fmt(b.gross)}</td>
              <td className="px-4 py-2 text-[12px] font-medium text-emerald-700 text-right">
                {fmt(b.gain)}
              </td>
            </tr>
          ))}
          {composition.buckets.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-[11.5px] text-neutral-500">
                Aucune donnée pour cette période.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-50">
            <td className="px-4 py-2 text-[12px] font-semibold text-neutral-800">TOTAL</td>
            <td className="px-4 py-2 text-[13px] font-bold text-neutral-800 text-right">
              {fmt(composition.totalGross)}
            </td>
            <td className="px-4 py-2 text-[13px] font-bold text-brand-gold-dark text-right">
              {fmt(composition.totalGain)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
