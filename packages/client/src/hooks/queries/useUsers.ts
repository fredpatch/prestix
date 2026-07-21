import { useQuery } from "@tanstack/react-query";
import { usersApi, type Role } from "@/lib/users.api";
import { queryKeys } from "@/lib/query-keys";

export function useUsers(filters: { search?: string; roleFilter?: Role | "" }) {
  return useQuery({
    queryKey: queryKeys.users(filters),
    queryFn: () =>
      usersApi
        .list({
          search: filters.search || undefined,
          role: (filters.roleFilter || undefined) as Role | undefined,
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}
