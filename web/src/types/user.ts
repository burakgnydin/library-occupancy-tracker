import type { UserRole } from './auth';

// Backend'in create-staff endpoint'i sadece Admin/User olusturmaya izin veriyor
// - SuperAdmin secimi zaten [AllowedValues(Admin, User)] ile 400'e dusuyor,
// formda bu secenegi hic sunmuyoruz (bkz. StaffPage.tsx).
export type StaffRole = 'Admin' | 'User';

// CreateStaffDto ile birebir.
export interface CreateStaffRequest {
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
}

// Backend'in UserDto'su ile birebir - hem create-staff'in donduğu tekil kayit
// hem de asagidaki listeleme endpoint'inin sayfalanmis sonuclari icin ayni
// sekil kullaniliyor (backend tarafinda da tek bir UserDto sinifi).
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserQueryParams {
  search?: string;
  role?: UserRole;
  pageNumber?: number;
  pageSize?: number;
}
