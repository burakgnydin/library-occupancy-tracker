import apiClient from './apiClient';
import type { AuthResponse, LoginRequest, RefreshRequest } from '../types/auth';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const payload: LoginRequest = { email, password };
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  const payload: RefreshRequest = { refreshToken };
  await apiClient.post('/auth/logout', payload);
}
