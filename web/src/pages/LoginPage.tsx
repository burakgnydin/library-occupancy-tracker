import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Zaten giris yapilmissa /login'e tekrar gelmesin - `from` state'i giris
  // sonrasi hangi sayfaya donulecegini tasir (ileride korumali bir sayfadan
  // /login'e yonlendirilen bir akis eklenirse buraya baglanabilir).
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Genis ekranlarda kurumsal bir "split panel" his - dar ekranlarda
          (mobil/tablet tarayici) tamamen gizlenip sadece form kalir. */}
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-white lg:flex">
        <div className="text-lg font-bold tracking-tight">TraKütüp</div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Kütüphane ağınızı
            <br />
            tek panelden yönetin
          </h1>
          <p className="mt-4 max-w-md text-sm text-primary-light/80">
            Doluluk oranlarını izleyin, kütüphaneleri ve kullanıcıları tek bir yerden yönetin.
          </p>
        </div>
        <p className="text-xs text-primary-light/60">© {new Date().getFullYear()} TraKütüp</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-lg font-bold tracking-tight text-ink">TraKütüp</span>
          </div>

          <h2 className="text-xl font-bold text-ink">Yönetim Paneline Giriş</h2>
          <p className="mt-1 text-sm text-ink-muted">Devam etmek için hesap bilgilerinizi girin.</p>

          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              E-posta
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Şifre
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-danger bg-danger-light px-3.5 py-2.5 text-sm font-medium text-danger">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-faint">Bu panel sadece yetkili yöneticiler içindir.</p>
        </div>
      </div>
    </div>
  );
}
