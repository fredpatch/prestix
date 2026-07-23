import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { rewardsApi, type RewardDateRangeParams } from "@/lib/rewards.api";

export function useRewardSummary(params: RewardDateRangeParams) {
  return useQuery({
    queryKey: queryKeys.rewardSummary(params),
    queryFn: () => rewardsApi.getSummary(params).then((r) => r.data),
  });
}
