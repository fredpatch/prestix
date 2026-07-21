import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { usersApi } from "@/lib/users.api";

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.userStats(),
    queryFn: () => usersApi.stats().then((r) => r.data),
  });
}
