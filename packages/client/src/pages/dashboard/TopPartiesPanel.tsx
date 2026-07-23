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
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-muted"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-[11px] font-bold text-body">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-body">{row.name}</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                {row.volume} opération{row.volume > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <p className="text-right text-[12px] font-bold tabular-nums text-foreground">
            {fmt(row.value)}
          </p>
        </Link>
      ))}
      {topRows.length === 0 && (
        <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
          Aucune donnée sur la période.
        </p>
      )}
    </div>
  );
}

export function TopPartiesPanel({ clients, referrers }: TopPartiesPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[13px] font-semibold text-foreground">Top parties</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Clients et référents les plus actifs.</p>
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
