type BadgeColor = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  label: string;
  color: BadgeColor;
}

const COLOR_CLASSNAME: Record<BadgeColor, string> = {
  primary: 'border-primary bg-primary-light text-primary',
  accent: 'border-accent bg-accent-light text-accent',
  success: 'border-success bg-success-light text-success',
  warning: 'border-warning bg-warning-light text-warning',
  danger: 'border-danger bg-danger-light text-danger',
  neutral: 'border-border bg-background text-ink-muted',
};

// LibrariesPage'in doluluk rozeti, StaffPage'in rol rozeti ve DashboardLayout'un topbar
// rol pill'inde tekrarlanan "rounded-full + padding + renk" gorsel deseni tek yerde.
// DashboardLayout'un pill'i onceden border'siz ve biraz farkli bir paddinge (px-3 py-1,
// border yok) sahipti - buraya tasinirken diger ikisiyle (doluluk/rol rozetleri) AYNI
// (ince renkli border'li) sekle normallesti; goze carpmayacak kadar kucuk bir fark.
export default function Badge({ label, color }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${COLOR_CLASSNAME[color]}`}>
      {label}
    </span>
  );
}
