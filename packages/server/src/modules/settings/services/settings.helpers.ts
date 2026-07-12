import { settings } from "../../../db/schema.js";
import type { SettingType, SettingView } from "./settings.types.js";

export function toSettingView(s: typeof settings.$inferSelect): SettingView {
  return {
    id: s.id,
    key: s.key,
    value: s.value,
    type: s.type as SettingType,
    module: s.module,
    description: s.description ?? undefined,
    updatedBy: s.updatedBy ?? undefined,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function validateValue(value: string, type: SettingType): void {
  if (type === "integer" && !/^\d+$/.test(value)) {
    throw new Error("INVALID_INTEGER_VALUE");
  }
  if (type === "boolean" && !["true", "false"].includes(value)) {
    throw new Error("INVALID_BOOLEAN_VALUE");
  }
  // text: no constraint
}
