// commission-catalog.api.ts
import api from "./axios";

export interface CommissionType {
  id: number;
  code: string;
  label: string;
  icon?: string;
  active: boolean;
}

export const commissionCatalogApi = {
  list: () => api.get<CommissionType[]>("/commission-catalog"),
  create: (data: { code: string; label: string; icon?: string }) =>
    api.post("/commission-catalog", data),
  toggleActive: (code: string, active: boolean) =>
    api.patch(`/commission-catalog/${code}/active`, { active }),
};
