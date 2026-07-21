import api from "./axios";

export type Role = "agent" | "manager" | "admin" | "super_admin";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  firstLogin: boolean;
  createdAt: string;
  updatedAt: string;
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

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    api.get<{ data: User[]; total: number }>("/users", { params: filters }),
  stats: () => api.get<UserStats>("/users/stats"),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: { email: string; fullName: string; role: Role }) => api.post<User>("/users", data),
  update: (id: number, data: { email?: string; role?: Role }) =>
    api.patch<User>(`/users/${id}`, data),
  toggleActivation: (id: number, active: boolean) =>
    api.patch<User>(`/users/${id}/activation`, { active }),
  resetOTP: (id: number) => api.post(`/users/${id}/reset-otp`),
};
