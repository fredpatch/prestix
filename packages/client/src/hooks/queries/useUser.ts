import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { usersApi } from "@/lib/users.api";

export function useUser(userId?: number) {
  return useQuery({
    queryKey: queryKeys.user(userId ?? 0),
    queryFn: () => usersApi.getById(userId as number).then((r) => r.data),
    enabled: Boolean(userId),
    retry: false,
  });
}
