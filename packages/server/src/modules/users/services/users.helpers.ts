import { users } from "../../../db/schema.js";
import type { UserView } from "./users.types.js";

export function toUserView(u: typeof users.$inferSelect): UserView {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    active: u.active,
    firstLogin: u.firstLogin,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}