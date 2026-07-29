import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactElement;
  // Verilmezse sadece giris yapilmis olmasi yeterli. Bu panelde zaten sadece
  // Admin/SuperAdmin giris yapabildigi icin (bkz. authStore.login) bugun
  // itibariyle pratikte hicbir sayfa User rolunu gormuyor - ama ileride
  // SuperAdmin'e ozel bir sayfa eklenirse (orn. backend'deki
  // PolicyNames.SuperAdminOnly ile korunan create-staff), route seviyesinde
  // ayni kisitlamayi burada da acikca tanimlamak icin bu prop var.
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
