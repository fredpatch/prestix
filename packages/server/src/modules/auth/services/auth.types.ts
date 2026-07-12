export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResult {
  firstLogin: boolean;
  tokens?: AuthTokens;
  user?: UserPublic;
  message: string;
}