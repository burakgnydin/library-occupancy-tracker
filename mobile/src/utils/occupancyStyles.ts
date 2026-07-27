import { colors } from '../theme/colors';
import type { OccupancyStatus } from '../types/library';

export const occupancyLabels: Record<OccupancyStatus, string> = {
  Low: 'Az yoğun',
  Medium: 'Orta yoğun',
  High: 'Çok yoğun',
};

interface OccupancyStyle {
  text: string;
  bg: string;
  border: string;
  solid: string;
}

// className degerleri tam literal string olarak burada durmali - Tailwind'in
// JIT tarayicisi bu dosyayi da (src/**/*.ts) taradigi icin dogru tespit eder.
export const occupancyStyles: Record<OccupancyStatus, OccupancyStyle> = {
  Low: { text: 'text-success', bg: 'bg-success-light', border: 'border-success', solid: colors.success },
  Medium: { text: 'text-warning', bg: 'bg-warning-light', border: 'border-warning', solid: colors.warning },
  High: { text: 'text-danger', bg: 'bg-danger-light', border: 'border-danger', solid: colors.danger },
};
