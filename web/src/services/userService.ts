import apiClient from './apiClient';
import type { PagedResult } from '../types/library';
import type { UserRole } from '../types/auth';
import type { CreateStaffRequest, User, UserQueryParams } from '../types/user';

export async function createStaff(payload: CreateStaffRequest): Promise<User> {
  const { data } = await apiClient.post<User>('/users/create-staff', payload);
  return data;
}

// Sadece SuperAdmin cagirabilir (backend Authorize(Policy = SuperAdminOnly)) -
// StaffPage disinda baska bir ekrandan cagrilmamali.
export async function getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
  const { data } = await apiClient.get<PagedResult<User>>('/users', { params });
  return data;
}

// Backend'in UpdateRoleAsync'i sadece "kendi rolunu degistiremezsin" kuralini
// uyguluyor (bkz. UsersController.UpdateRole) - SuperAdmin dahil herhangi bir
// role gecis, BASKA bir kullanici hedeflendigi surece kabul ediliyor.
export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const { data } = await apiClient.put<User>(`/users/${userId}/role`, { role });
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}
