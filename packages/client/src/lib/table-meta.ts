// Module augmentation so `columnDef.meta` is typed on every ColumnDef
// without each table variant redefining its own meta shape. Loosely typed
// on purpose (ColumnDef<T, any> everywhere) — the priority here is fast
// adoption across ~15 existing hand-rolled tables, not per-page strictness.
import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    /** Text alignment for both the header and body cells of this column. Defaults to left. */
    align?: "left" | "right" | "center";
  }
}

export function alignClass(align: "left" | "right" | "center" | undefined): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}
