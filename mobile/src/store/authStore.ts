import { create } from 'zustand';

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  registerSessionRefreshedHandler,
  registerUnauthorizedHandler,
} from '../services/apiClient';
import * as authService from '../services/authService';
import { secureStorage } from '../services/secureStorage';
import type { UserRole } from '../types/auth';
import { getApiErrorMessage } from '../utils/apiError';

const ROLE_KEY = 'authRole';

const FALLBACK_MESSAGES = {
  login: 'Giriş başarısız. Bilgilerinizi kontrol edin.',
  register: 'Kayıt oluşturulamadı. Lütfen tekrar deneyin.',
} as const;

interface Session {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
}

export type RegisterOutcome = 'success' | 'registered-but-login-failed' | 'failed';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  isSubmitting: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<RegisterOutcome>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,
  isHydrating: true,
  isSubmitting: false,
  error: null,

  hydrate: async () => {
    const [accessToken, refreshToken, role] = await Promise.all([
      secureStorage.getItem(ACCESS_TOKEN_KEY),
      secureStorage.getItem(REFRESH_TOKEN_KEY),
      secureStorage.getItem(ROLE_KEY),
    ]);

    set({
      accessToken,
      refreshToken,
      role: (role as UserRole | null) ?? null,
      isAuthenticated: Boolean(accessToken && refreshToken),
      isHydrating: false,
    });
  },

  setSession: async ({ accessToken, refreshToken, role }) => {
    await Promise.all([
      secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
      secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      secureStorage.setItem(ROLE_KEY, role),
    ]);
    set({ accessToken, refreshToken, role, isAuthenticated: true });
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await authService.login(email, password);
      await get().setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        role: response.role,
      });
      set({ isSubmitting: false });
      return true;
    } catch (err) {
      set({ error: getApiErrorMessage(err, FALLBACK_MESSAGES.login), isSubmitting: false });
      return false;
    }
  },

  register: async (fullName, email, password) => {
    set({ isSubmitting: true, error: null });

    try {
      await authService.register(fullName, email, password);
    } catch (err) {
      set({ error: getApiErrorMessage(err, FALLBACK_MESSAGES.register), isSubmitting: false });
      return 'failed';
    }

    // Kayit basariyla tamamlandi - otomatik giris ayri bir adim, basarisiz
    // olsa bile kullanicinin hesabi zaten olusturulmus oldugundan bunu bir
    // "kayit hatasi" gibi gostermiyoruz (cagiran taraf Login'e yonlendirir).
    try {
      const response = await authService.login(email, password);
      await get().setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        role: response.role,
      });
      set({ isSubmitting: false });
      return 'success';
    } catch {
      set({ isSubmitting: false });
      return 'registered-but-login-failed';
    }
  },

  logout: async () => {
    const refreshToken = get().refreshToken;
    if (refreshToken) {
      // Best-effort: sunucu tarafi revoke istegi basarisiz olsa/yanit vermese
      // bile kullaniciyi bekletmeden yerel oturum kapatilir.
      authService.logout(refreshToken).catch(() => {});
    }

    await Promise.all([
      secureStorage.deleteItem(ACCESS_TOKEN_KEY),
      secureStorage.deleteItem(REFRESH_TOKEN_KEY),
      secureStorage.deleteItem(ROLE_KEY),
    ]);
    set({ accessToken: null, refreshToken: null, role: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

registerSessionRefreshedHandler((session) => useAuthStore.getState().setSession(session));
registerUnauthorizedHandler(() => useAuthStore.getState().logout());
