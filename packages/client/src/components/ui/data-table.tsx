import { useState } from "react";
import { Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { alignClass } from "@/lib/table-meta";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

// Management/list tables — parties, commissions, invoices, users, etc.
// Search and select filters stay owned by the parent page (as they already
// are everywhere today); this component only owns sorting and the shared
// visual shell. Not paginated — none of the existing tables paginate today,
// so this stays a straight port rather than adding new behavior.
export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "Aucun résultat.",
  onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return <Loader2 className="animate-spin text-neutral-400" size={18} />;
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 ${alignClass(header.column.columnDef.meta?.align)} ${sortable ? "cursor-pointer select-none" : ""}`}
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
                          <ChevronsUpDown size={11} className="text-neutral-300" />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={`border-b border-neutral-100 last:border-0 hover:bg-neutral-50 ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`px-4 py-2.5 ${alignClass(cell.column.columnDef.meta?.align)}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[12px] text-neutral-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
