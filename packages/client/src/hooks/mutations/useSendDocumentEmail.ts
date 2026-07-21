import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deliveryNoteApi } from "@/lib/delivery-note.api";
import { invoiceApi, type DocumentEmailResult } from "@/lib/invoice.api";
import { proformaApi } from "@/lib/proforma.api";
import { queryKeys } from "@/lib/query-keys";

type DocumentEmailTarget =
  | { kind: "invoice"; id: number; to?: string }
  | { kind: "proforma"; id: number; to?: string }
  | { kind: "delivery-note"; invoiceId: number; to?: string };

function sendTarget(target: DocumentEmailTarget): Promise<DocumentEmailResult> {
  if (target.kind === "invoice") {
    return invoiceApi.sendEmail(target.id, target.to).then((r) => r.data);
  }
  if (target.kind === "proforma") {
    return proformaApi.sendEmail(target.id, target.to).then((r) => r.data);
  }
  return deliveryNoteApi.sendEmail(target.invoiceId, target.to).then((r) => r.data);
}

export function useSendDocumentEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendTarget,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mailOutbox() });
      if (result.success) {
        toast.success("Email envoye au client.");
      } else {
        toast.error(result.errorMessage ?? "Email non envoye.");
      }
    },
    onError: (error: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mailOutbox() });
      const code = (error as { code?: string })?.code;
      if (code === "ECONNABORTED") {
        toast.warning("L'envoi prend plus de temps que prevu. Verifiez l'historique email.");
        return;
      }
      toast.error("Erreur lors de l'envoi de l'email.");
    },
  });
}
