import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoiceApi } from "@/lib/invoice.api";
import { queryKeys } from "@/lib/query-keys";

export function useSendInvoiceReminderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, to }: { invoiceId: number; to?: string }) =>
      invoiceApi.sendReminder(invoiceId, to).then((r) => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mailOutbox() });
      const ownersSent = result.owners.filter((o) => o.success).length;
      const ownersFailed = result.owners.length - ownersSent;

      if (result.client.success) {
        toast.success(
          ownersFailed > 0
            ? `Rappel envoye au client (${ownersSent}/${result.owners.length} notification(s) interne(s) envoyee(s)).`
            : "Rappel envoye au client.",
        );
      } else {
        toast.error(result.client.errorMessage ?? "Rappel non envoye au client.");
      }
    },
    onError: (error: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mailOutbox() });
      const code = (error as { code?: string })?.code;
      if (code === "ECONNABORTED") {
        toast.warning("L'envoi prend plus de temps que prevu. Verifiez l'historique email.");
        return;
      }
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (message === "INVOICE_ALREADY_PAID") {
        toast.info("Cette facture est deja payee, aucun rappel necessaire.");
        return;
      }
      toast.error("Erreur lors de l'envoi du rappel.");
    },
  });
}
