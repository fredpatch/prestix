import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/invoice.api";
import { queryKeys } from "@/lib/query-keys";

export function useInvoices(partyId?: number) {
  return useQuery({
    queryKey: queryKeys.invoices(partyId ? { partyId } : undefined),
    queryFn: () => invoiceApi.list(partyId).then((r) => r.data),
  });
}
