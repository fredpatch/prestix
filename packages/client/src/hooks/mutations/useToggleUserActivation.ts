import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/users.api";
import { queryKeys } from "@/lib/query-keys";

export function useToggleUserActivationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      usersApi.toggleActivation(id, active).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}
