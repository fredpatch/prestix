import api from "./axios";

export const authApi = {
  login: (email: string, otp?: string, password?: string) =>
    api.post("/auth/login", { email, otp, password }),

  setPassword: (password: string, confirmation: string) =>
    api.post("/auth/set-password", { password, confirmation }),

  refresh: () => api.post("/auth/refresh"),

  logout: () => api.post("/auth/logout"),

  me: () => api.get("/auth/me"),
};
