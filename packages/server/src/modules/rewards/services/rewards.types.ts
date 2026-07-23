export type RewardAudience = "client" | "referrer" | "employee";

export interface RewardDateRange {
  from: string;
  to: string;
}

export interface RewardRule {
  audience: RewardAudience;
  enabled: boolean;
  thresholdGain: number;
  rateBps: number;
  fixedAmount: number;
}

export interface RewardRow {
  id: number;
  name: string;
  audience: RewardAudience;
  gain: number;
  volume: number;
  eligible: boolean;
  estimatedReward: number;
  rule: RewardRule;
}

export interface RewardSummary {
  period: RewardDateRange;
  globalEnabled: boolean;
  basis: "gain";
  mode: "preview";
  totals: {
    monitoredGain: number;
    eligibleGain: number;
    estimatedRewards: number;
    eligibleClients: number;
    eligibleReferrers: number;
    eligibleEmployees: number;
  };
  rules: RewardRule[];
  topRows: {
    clients: RewardRow[];
    referrers: RewardRow[];
    employees: RewardRow[];
  };
}
