// tailwind.config.js'deki theme.extend.colors ile birebir ayni tutulmali.
// Ikon rengi gibi className kabul etmeyen yerlerde kullanilir.
export const colors = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#EEF2FF',
  accent: '#0D9488',
  accentLight: '#CCFBF1',
  ink: '#0F172A',
  inkMuted: '#64748B',
  inkFaint: '#94A3B8',
  surface: '#FFFFFF',
  background: '#F8FAFC',
  border: '#E2E8F0',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
} as const;
