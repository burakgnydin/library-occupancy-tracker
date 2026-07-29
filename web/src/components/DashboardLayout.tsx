import { useState } from 'react';
import type { ReactNode } from 'react';

import ConfirmDialog from './ConfirmDialog';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/authStore';
import { ROLE_LABELS } from '../types/auth';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

// Sidebar + topbar kabugu - Kutuphaneler/Kullanicilar sayfalari eklendiginde
// aynen bu bicimde (sadece title + children degiserek) yeniden kullanilacak,
// boylece kabuk kodu tek yerde kalir.
export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
          <h1 className="text-base font-semibold text-ink">{title}</h1>

          <div className="flex items-center gap-4">
            {role ? (
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                {ROLE_LABELS[role] ?? role}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-ink-muted transition hover:border-danger hover:text-danger"
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>

      {isLogoutConfirmOpen ? (
        <ConfirmDialog
          title="Çıkış Yap"
          message="Çıkış yapmak istediğinizden emin misiniz?"
          confirmText="Çıkış Yap"
          isDangerous
          onConfirm={() => {
            setIsLogoutConfirmOpen(false);
            logout();
          }}
          onCancel={() => setIsLogoutConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
