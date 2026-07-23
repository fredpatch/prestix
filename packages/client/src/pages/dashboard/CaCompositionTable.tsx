import type { ColumnDef } from "@tanstack/react-table";
import type { CaCompositionBucket, CaCompositionResult } from "@/lib/reporting.api";
import { fmt } from "./format";
import { cn } from "@/lib/utils";
import { ReadOnlyTable } from "@/components/ui/read-only-table";
import { TableRow, TableCell } from "@/components/ui/table";

interface CaCompositionTableProps {
  composition: CaCompositionResult;
  className?: string;
  showVolume?: boolean; // off by default — dashboard stays as-is, Services tab turns it on
}

// CA composition - gross always shown, gain always shown, buckets dynamic
export function CaCompositionTable({ composition, className, showVolume = false }: CaCompositionTableProps) {
  const columns: ColumnDef<CaCompositionBucket, any>[] = [
    { accessorKey: "label", header: "Bucket" },
    ...(showVolume
      ? [{ accessorKey: "volume", header: "Volume", meta: { align: "right" as const } }]
      : []),
    {
      accessorKey: "gross",
      header: "CA Brut (XAF)",
      meta: { align: "right" },
      cell: ({ row }) => fmt(row.original.gross),
    },
    {
      accessorKey: "gain",
      header: "Gain (XAF)",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-medium text-success-text">{fmt(row.original.gain)}</span>,
    },
  ];

  return (
    <div className={cn("mb-6", className)}>
      <ReadOnlyTable
        title={
          <div className="flex items-center justify-between">
            <span>Composition du CA</span>
            <span className="text-[10.5px] font-normal text-muted-foreground">
              Factures émises uniquement - brouillons et annulées exclues
            </span>
          </div>
        }
        columns={columns}
        data={composition.buckets}
        footer={
          <TableRow className="hover:bg-transparent">
            <TableCell className="px-4 py-2 text-[12px] font-semibold text-body">TOTAL</TableCell>
            {showVolume && <TableCell className="px-4 py-2" />}
            <TableCell className="px-4 py-2 text-[13px] font-bold text-body text-right">
              {fmt(composition.totalGross)}
            </TableCell>
            <TableCell className="px-4 py-2 text-[13px] font-bold text-brand-gold-dark text-right">
              {fmt(composition.totalGain)}
            </TableCell>
          </TableRow>
        }
      />
    </div>
  );
}
