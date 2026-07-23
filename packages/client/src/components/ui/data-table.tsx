import { useState } from "react";
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { alignClass } from "@/lib/table-meta";
import { Button } from "@/components/ui/button";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

// Management/list tables — parties, commissions, invoices, users, etc.
// Search and select filters stay owned by the parent page (as they already
// are everywhere today); this component only owns sorting and the shared
// visual shell. Pagination defaults to 10 rows so management tables stay
// scannable as datasets grow. Built on the shadcn Table primitives, with
// className overrides reproducing the existing hand-rolled look.
export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "Aucun résultat.",
  onRowClick,
  pageSize = 10,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return <Loader2 className="animate-spin text-subtle" size={18} />;
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-surface-muted border-b border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                    className={`h-auto px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal ${alignClass(header.column.columnDef.meta?.align)} ${sortable ? "cursor-pointer select-none" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable &&
                        (sorted === "asc" ? (
                          <ChevronUp size={11} />
                        ) : sorted === "desc" ? (
                          <ChevronDown size={11} />
                        ) : (
                          <ChevronsUpDown size={11} className="text-subtle" />
                        ))}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={`border-b border-border last:border-0 hover:bg-surface-muted ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={`px-4 py-2.5 whitespace-normal ${alignClass(cell.column.columnDef.meta?.align)}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="px-4 py-8 text-center text-[12px] text-muted-foreground whitespace-normal"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {data.length > pageSize && (
        <div className="flex flex-col gap-2 border-t border-border bg-surface-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground">
            {pagination.pageIndex * pagination.pageSize + 1}-
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length)} sur{" "}
            {data.length}
          </p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft size={13} />
              Précédent
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Page {pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Suivant
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
