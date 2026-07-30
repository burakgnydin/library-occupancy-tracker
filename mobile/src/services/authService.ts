import type { AxiosRequestConfig } from 'axios';

import apiClient from './apiClient';
import type { AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, RegisteredUser } from '../types/auth';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const payload: LoginRequest = { email, password };
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
): Promise<RegisteredUser> {
  const payload: RegisterRequest = { fullName, email, password };
  const { data } = await apiClient.post<RegisteredUser>('/users/register', payload);
  return data;
}

// config opsiyoneldir - apiClient.ts'in 401 interceptor'i burayi ozel bir timeout
// (REFRESH_TIMEOUT_MS) ile cagirir, diger cagiranlar varsayilan apiClient timeout'unu kullanir.
export async function refresh(refreshToken: string, config?: AxiosRequestConfig): Promise<AuthResponse> {
  const payload: RefreshRequest = { refreshToken };
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh', payload, config);
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  const payload: RefreshRequest = { refreshToken };
  await apiClient.post('/auth/logout', payload);
}
