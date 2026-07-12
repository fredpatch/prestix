export type SettingType = "integer" | "boolean" | "text";

export interface SettingView {
  id: number;
  key: string;
  value: string;
  type: SettingType;
  module: string;
  description?: string;
  updatedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}
