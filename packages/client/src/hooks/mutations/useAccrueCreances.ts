import { useMutation, useQueryClient } from "@tanstack/react-query";
import { creanceApi } from "@/lib/creance.api";
import { queryKeys } from "@/lib/query-keys";

export function useAccrueCreancesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => creanceApi.accrueNow().then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creances() });
    },
    // No onError override — falls through to the global toast in
    // query-client.ts. Success message stays page-local (passed via the
    // mutate() call's own onSuccess), since "X pénalité(s) accumulée(s)"
    // isn't an error and doesn't belong in the shared error-toast path.
  });
}
