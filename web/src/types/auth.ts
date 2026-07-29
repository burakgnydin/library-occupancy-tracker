export type UserRole = 'User' | 'Admin' | 'SuperAdmin';

// DashboardLayout, DashboardPage ve StaffPage'in ucu de ayni etiketleri
// gosterdigi icin tek yerden - kopyalar birbirinden sessizce sapmasin.
export const ROLE_LABELS: Record<UserRole, string> = {
  User: 'Kullanıcı',
  Admin: 'Yönetici',
  SuperAdmin: 'Süper Yönetici',
};

export interface LoginRequest {
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

export interface ApiErrorResponse {
  message: string;
}
