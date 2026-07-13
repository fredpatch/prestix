// settings.api.ts
import api from "./axios";

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: "integer" | "boolean" | "text";
  module: string;
  description?: string;
}

export const settingsApi = {
  list: () => api.get<Setting[]>("/settings"),
  update: (key: string, value: string) => api.patch(`/settings/${key}`, { value }),
};
