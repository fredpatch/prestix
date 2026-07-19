import { Link } from "react-router-dom";
import type { KpiRow } from "@/lib/reporting.api";
import { fmt } from "./format";

interface KpiTableProps {
  title: string;
  rows: KpiRow[];
  linkTo?: (id: number) => string; // optional — dashboard usage stays plain text, analyse usage links to the party page
  limit?: number;
}

export function KpiTable({ title, rows, linkTo, limit = 10 }: KpiTableProps) {
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
          {rows.slice(0, limit).map((r) => (
            <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
              <td className="px-4 py-2 text-[12px] text-neutral-800">
                {linkTo ? (
                  <Link to={linkTo(r.id)} className="hover:text-brand-gold-dark hover:underline">
                    {r.name}
                  </Link>
                ) : (
                  r.name
                )}
              </td>
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
