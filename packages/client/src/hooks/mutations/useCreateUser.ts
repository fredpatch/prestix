import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/users.api";
import { queryKeys } from "@/lib/query-keys";

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof usersApi.create>[0]) =>
      usersApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}
