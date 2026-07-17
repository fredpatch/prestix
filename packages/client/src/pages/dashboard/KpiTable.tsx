import type { KpiRow } from "@/lib/reporting.api";
import { fmt } from "./format";

interface KpiTableProps {
  title: string;
  rows: KpiRow[];
}

export function KpiTable({ title, rows }: KpiTableProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-neutral-200">
        <p className="text-[11.5px] font-semibold text-neutral-800">{title}</p>
      </div>
      <table className="w-full text-left">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
              Nom
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
              Volume
            </th>
            <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
              Valeur (XAF)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((r) => (
            <tr key={r.id} className="border-b border-neutral-100 last:border-0">
              <td className="px-4 py-2 text-[12px] text-neutral-800">{r.name}</td>
              <td className="px-4 py-2 text-[12px] text-neutral-500 text-right">{r.volume}</td>
              <td className="px-4 py-2 text-[12px] font-medium text-neutral-800 text-right">
                {fmt(r.value)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-[11.5px] text-neutral-500">
                Aucune donnée pour cette période.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
