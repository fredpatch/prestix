import type { roleEnum } from "../../../db/schema.js";

type Role = (typeof roleEnum.enumValues)[number];

export interface UserView {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  firstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  firstLogin: number;
  agents: number;
  managers: number;
  admins: number;
  superAdmins: number;
}

export interface CreateUserParams {
  email: string;
  fullName: string;
  role: Role;
  createdByUserId: number;
}

export interface UpdateUserParams {
  role?: Role;
  active?: boolean;
  email?: string;
  updatedByUserId: number;
}
