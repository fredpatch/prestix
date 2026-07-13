// feature-flags.api.ts
import api from "./axios";

export interface FeatureFlag {
  id: number;
  moduleCode: string;
  enabled: boolean;
}

export const featureFlagsApi = {
  list: () => api.get<FeatureFlag[]>("/feature-flags"),
  toggle: (moduleCode: string, enabled: boolean) =>
    api.patch(`/feature-flags/${moduleCode}`, { enabled }),
};
