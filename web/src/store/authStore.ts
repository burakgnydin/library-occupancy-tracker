import { isAxiosError } from 'axios';
import { create } from 'zustand';

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  registerSessionRefreshedHandler,
  registerUnauthorizedHandler,
} from '../services/apiClient';
import * as authService from '../services/authService';
import type { ApiErrorResponse, UserRole } from '../types/auth';

const ROLE_KEY = 'authRole';
const NAME_IDENTIFIER_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

const PANEL_ROLES: readonly UserRole[] = ['Admin', 'SuperAdmin'];

interface Session {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  userId: string | null;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  error: string | null;
  setSession: (session: Session) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// Backend'in accessToken'i JWT - kullanicinin kendi id'sini (nameidentifier
// claim'i) ayrica bir /me endpoint'i cagirmadan dogrudan token'in payload'indan
// okuyoruz. Sadece bu tek alan icin bir kutuphane eklemek yerine (jwt-decode
// vb.) standart base64url -> JSON cozme birkaç satirlik bir islem.
function decodeUserIdFromToken(token: string): string | null {
  try {
    const payloadBase64Url = token.split('.')[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = decodeURIComponent(
      atob(payloadBase64)
        .split('')
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const userId = payload[NAME_IDENTIFIER_CLAIM];
    return typeof userId === 'string' ? userId : null;
  } catch {
    return null;
  }
}

const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
const storedRole = localStorage.getItem(ROLE_KEY) as UserRole | null;

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  role: storedRole,
  userId: storedAccessToken ? decodeUserIdFromToken(storedAccessToken) : null,
  isAuthenticated: Boolean(storedAccessToken && storedRefreshToken),
  isSubmitting: false,
  error: null,

  setSession: ({ accessToken, refreshToken, role }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(ROLE_KEY, role);
    set({ accessToken, refreshToken, role, userId: decodeUserIdFromToken(accessToken), isAuthenticated: true });
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await authService.login(email, password);

      // Bu panel sadece Admin/SuperAdmin icin - backend girisi engellemese
      // bile (rol dogru donse bile) panel seviyesinde reddediyoruz. Token'i
      // rol kontrolunden ONCE hic yazmadigimiz icin - reddedilen bir User
      // girisi sonrasi localStorage'da "yazilip sonra silinen" degil, hic
      // hiç var olmamis bir token durumu olusuyor (daha guclu bir garanti).
      if (!PANEL_ROLES.includes(response.role)) {
        set({ error: 'Bu panele erişim yetkiniz yok.', isSubmitting: false });
        return false;
      }

      get().setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        role: response.role,
      });
      set({ isSubmitting: false });
      return true;
    } catch (err) {
      const message = isAxiosError<ApiErrorResponse>(err)
        ? (err.response?.data?.message ?? 'Giriş başarısız. Bilgilerinizi kontrol edin.')
        : 'Giriş başarısız. Bilgilerinizi kontrol edin.';
      set({ error: message, isSubmitting: false });
      return false;
    }
  },

  logout: () => {
    const refreshToken = get().refreshToken;
    if (refreshToken) {
      // Best-effort: sunucu tarafi revoke istegi basarisiz olsa/yanit vermese
      // bile kullaniciyi bekletmeden yerel oturum kapatilir.
      authService.logout(refreshToken).catch(() => {});
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    set({ accessToken: null, refreshToken: null, role: null, userId: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

registerSessionRefreshedHandler((session) => useAuthStore.getState().setSession(session));
registerUnauthorizedHandler(() => useAuthStore.getState().logout());
