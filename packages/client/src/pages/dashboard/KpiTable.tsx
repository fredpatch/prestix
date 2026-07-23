import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import type { KpiRow } from "@/lib/reporting.api";
import { fmt } from "./format";
import { ReadOnlyTable } from "@/components/ui/read-only-table";

interface KpiTableProps {
  title: string;
  rows: KpiRow[];
  linkTo?: (id: number) => string; // optional — dashboard usage stays plain text, analyse usage links to the party page
  limit?: number;
}

export function KpiTable({ title, rows, linkTo, limit = 10 }: KpiTableProps) {
  const columns: ColumnDef<KpiRow, any>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) =>
        linkTo ? (
          <Link to={linkTo(row.original.id)} className="hover:text-brand-gold-dark hover:underline">
            {row.original.name}
          </Link>
        ) : (
          row.original.name
        ),
    },
    {
      accessorKey: "volume",
      header: "Volume",
      meta: { align: "right" },
    },
    {
      accessorKey: "value",
      header: "Valeur (XAF)",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-medium text-body">{fmt(row.original.value)}</span>,
    },
  ];

  return <ReadOnlyTable columns={columns} data={rows} title={title} limit={limit} />;
}
