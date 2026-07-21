import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/users.api";
import { queryKeys } from "@/lib/query-keys";

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
    },
  });
}
