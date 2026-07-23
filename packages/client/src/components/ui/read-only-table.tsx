import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { alignClass } from "@/lib/table-meta";

interface ReadOnlyTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  title?: React.ReactNode;
  limit?: number;
  emptyMessage?: string;
  // Full control given to the caller — totals rows vary too much in shape
  // (some columns spanned, some blank, some showing a second value) to
  // generalize into column defs. Expects one or more <TableRow> elements.
  footer?: React.ReactNode;
  // Skips the outer bg-white/border/rounded card and the title block —
  // for tables nested inside a caller's own custom card (e.g. a card with
  // a chart above the table), where the default wrapper would double up.
  bare?: boolean;
}

// Static display table — KPI lists, dashboard/analyse breakdowns. No sort,
// no filter, no pagination: those tables are read at a glance, not
// interacted with. Built on the shadcn Table primitives; className
// overrides below reproduce the existing hand-rolled KpiTable/
// CaCompositionTable look exactly (twMerge resolves the conflicting
// defaults, e.g. shadcn's h-10 px-2 → our px-4 py-2).
export function ReadOnlyTable<T>({
  columns,
  data,
  title,
  limit,
  emptyMessage = "Aucune donnée pour cette période.",
  footer,
  bare = false,
}: ReadOnlyTableProps<T>) {
  const rows = limit ? data.slice(0, limit) : data;

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableElement = (
    <Table>
      <TableHeader className="bg-surface-muted border-b border-border">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={`h-auto px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal ${alignClass(header.column.columnDef.meta?.align)}`}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={`px-4 py-2 text-[12px] text-body whitespace-normal ${alignClass(cell.column.columnDef.meta?.align)}`}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns.length}
              className="px-4 py-6 text-center text-[11.5px] text-muted-foreground whitespace-normal"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      {footer && rows.length > 0 && <TableFooter className="bg-surface-muted">{footer}</TableFooter>}
    </Table>
  );

  if (bare) return tableElement;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-border">
          <div className="text-[11.5px] font-semibold text-body">{title}</div>
        </div>
      )}
      {tableElement}
    </div>
  );
}
