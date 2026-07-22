import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationApi } from "@/lib/notification.api";
import { queryKeys } from "@/lib/query-keys";

export function useRetryMailOutboxItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationApi.mailOutboxRetry(id).then((r) => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mailOutbox() });
      queryClient.invalidateQueries({ queryKey: ["notifications", "mail-outbox", "list"] });
      if (result.success) {
        toast.success("Email renvoye avec succes.");
      } else {
        toast.error(result.errorMessage ?? "Le renvoi a echoue.");
      }
    },
    onError: (error: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "mail-outbox", "list"] });
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (message === "MAIL_OUTBOX_ITEM_NOT_RETRYABLE") {
        toast.error("Ce type d'email ne peut pas etre renvoye automatiquement.");
        return;
      }
      if (message === "MAIL_OUTBOX_ITEM_NOT_FAILED") {
        toast.info("Cet email a deja ete envoye avec succes.");
        return;
      }
      if (message === "RECIPIENT_EMAIL_REQUIRED") {
        toast.error("Le client n'a pas d'adresse email enregistree.");
        return;
      }
      toast.error("Erreur lors du renvoi de l'email.");
    },
  });
}
