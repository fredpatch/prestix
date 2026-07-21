import { useMutation } from "@tanstack/react-query";
import { deliveryNoteApi } from "@/lib/delivery-note.api";

export function useCreateDeliveryNoteMutation() {
  return useMutation({
    mutationFn: (invoiceId: number) => deliveryNoteApi.create(invoiceId).then((r) => r.data),
    // No cache invalidation — the delivery note isn't part of the invoice
    // query payload; the caller stores the result in local state directly
    // via mutate()'s own onSuccess, same as before.
  });
}
