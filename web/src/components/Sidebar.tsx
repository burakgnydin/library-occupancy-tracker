import { memo } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string | null;
  icon: ReactNode;
}

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Ana Sayfa',
    path: '/',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    label: 'Kütüphaneler',
    path: '/libraries',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    ),
  },
  {
    label: 'Kullanıcılar',
    path: '/staff',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

// Hicbir prop almadigi icin memo() ozel bir karsilastirma fonksiyonu
// gerektirmeden calisir - DashboardLayout sadece kendi lokal state'i (orn.
// isLogoutConfirmOpen) yuzunden yeniden render oldugunda Sidebar'in gereksiz
// yere yeniden render olmasini engeller. Rota degisince NavLink kendi router
// context aboneligi uzerinden zaten dogru guncelleniyor - memo bunu etkilemez.
function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-bold tracking-tight text-ink">TraKütüp</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) =>
          item.path ? (
            <NavLink
              key={item.label}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-primary-light text-primary' : 'text-ink-muted hover:bg-background hover:text-ink'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ) : (
            <div
              key={item.label}
              aria-disabled
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-faint"
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                Yakında
              </span>
            </div>
          ),
        )}
      </nav>
    </aside>
  );
}

export default memo(Sidebar);
