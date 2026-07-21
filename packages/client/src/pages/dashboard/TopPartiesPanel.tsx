import { Link } from "react-router-dom";
import type { KpiRow } from "@/lib/reporting.api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmt } from "./format";

interface TopPartiesPanelProps {
  clients: KpiRow[];
  referrers: KpiRow[];
}

function PartyList({ rows }: { rows: KpiRow[] }) {
  const topRows = rows.slice(0, 5);
  return (
    <div className="divide-y divide-neutral-100">
      {topRows.map((row, index) => (
        <Link
          key={row.id}
          to={`/parties/${row.id}`}
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-600">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-neutral-800">{row.name}</p>
              <p className="mt-0.5 text-[10.5px] text-neutral-500">
                {row.volume} opération{row.volume > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <p className="text-right text-[12px] font-bold tabular-nums text-neutral-900">
            {fmt(row.value)}
          </p>
        </Link>
      ))}
      {topRows.length === 0 && (
        <p className="px-4 py-8 text-center text-[12px] text-neutral-500">
          Aucune donnée sur la période.
        </p>
      )}
    </div>
  );
}

export function TopPartiesPanel({ clients, referrers }: TopPartiesPanelProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <p className="text-[13px] font-semibold text-neutral-900">Top parties</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">Clients et référents les plus actifs.</p>
      </div>
      <Tabs defaultValue="clients">
        <TabsList className="px-4">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="referrers">Référents</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <PartyList rows={clients} />
        </TabsContent>
        <TabsContent value="referrers">
          <PartyList rows={referrers} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
