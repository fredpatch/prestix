import { useMutation } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/invoice.api";

export function usePromoteProformaMutation() {
  return useMutation({
    mutationFn: (proformaId: number) => invoiceApi.promoteFromProforma(proformaId).then((r) => r.data),
    // No cache invalidation — original behavior navigates straight to the
    // new invoice page on success rather than reloading this page's data.
  });
}
