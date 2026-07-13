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

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    api.get<{ data: User[]; total: number }>("/users", { params: filters }),
  create: (data: { email: string; fullName: string; role: Role }) => api.post<User>("/users", data),
  update: (id: number, data: { email?: string; role?: Role }) =>
    api.patch<User>(`/users/${id}`, data),
  toggleActivation: (id: number, active: boolean) =>
    api.patch<User>(`/users/${id}/activation`, { active }),
  resetOTP: (id: number) => api.post(`/users/${id}/reset-otp`),
};
