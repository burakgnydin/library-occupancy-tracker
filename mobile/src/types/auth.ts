export type UserRole = 'User' | 'Admin' | 'SuperAdmin';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  role: UserRole;
}

export interface RegisteredUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  message: string;
}
