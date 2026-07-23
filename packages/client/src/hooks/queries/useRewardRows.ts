import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { rewardsApi, type RewardDateRangeParams, type RewardRow } from "@/lib/rewards.api";

type RewardRowsAudience = "clients" | "referrers" | "employees";

const loaders: Record<RewardRowsAudience, (params: RewardDateRangeParams) => Promise<{ data: RewardRow[] }>> = {
  clients: rewardsApi.getClients,
  referrers: rewardsApi.getReferrers,
  employees: rewardsApi.getEmployees,
};

export function useRewardRows(audience: RewardRowsAudience, params: RewardDateRangeParams) {
  return useQuery({
    queryKey: queryKeys.rewardRows(audience, params),
    queryFn: () => loaders[audience](params).then((r) => r.data),
  });
}
