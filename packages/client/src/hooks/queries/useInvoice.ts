import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "@/lib/invoice.api";
import { queryKeys } from "@/lib/query-keys";

export function useInvoice(invoiceId: number) {
  return useQuery({
    queryKey: queryKeys.invoice(invoiceId),
    queryFn: () => invoiceApi.getById(invoiceId).then((r) => r.data),
  });
}
