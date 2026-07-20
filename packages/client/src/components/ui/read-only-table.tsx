import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { alignClass } from "@/lib/table-meta";

interface ReadOnlyTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  title?: string;
  limit?: number;
  emptyMessage?: string;
}

// Static display table — KPI lists, dashboard/analyse breakdowns. No sort,
// no filter, no pagination: those tables are read at a glance, not
// interacted with. Visual output matches the existing hand-rolled
// KpiTable/CaCompositionTable markup exactly, just generic over columns.
export function ReadOnlyTable<T>({
  columns,
  data,
  title,
  limit,
  emptyMessage = "Aucune donnée pour cette période.",
}: ReadOnlyTableProps<T>) {
  const rows = limit ? data.slice(0, limit) : data;

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-neutral-200">
          <p className="text-[11.5px] font-semibold text-neutral-800">{title}</p>
        </div>
      )}
      <table className="w-full text-left">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 ${alignClass(header.column.columnDef.meta?.align)}`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`px-4 py-2 text-[12px] text-neutral-800 ${alignClass(cell.column.columnDef.meta?.align)}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-[11.5px] text-neutral-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
