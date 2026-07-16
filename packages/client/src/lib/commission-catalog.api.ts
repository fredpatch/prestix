// commission-catalog.api.ts
import api from "./axios";

export interface CommissionType {
  id: number;
  code: string;
  label: string;
  icon?: string;
  active: boolean;
  fieldSchema?: Record<string, string>; // e.g. { operateur: "string" }, values follow the "string"/"string?"/"period"/"enum:a,b" convention
}

export const commissionCatalogApi = {
  list: () => api.get<CommissionType[]>("/commission-catalog"),
  create: (data: { code: string; label: string; icon?: string; fieldSchema?: Record<string, string> }) =>
    api.post("/commission-catalog", data),
  update: (code: string, data: { label?: string; icon?: string; fieldSchema?: Record<string, string> }) =>
    api.patch<CommissionType>(`/commission-catalog/${code}`, data),
  toggleActive: (code: string, active: boolean) =>
    api.patch(`/commission-catalog/${code}/active`, { active }),
};
