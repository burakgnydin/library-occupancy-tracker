import { z } from 'zod';

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

// occupancyStatus, network sinirini gectikten sonra TypeScript'te OccupancyStatus union'u
// olarak "guvenli" GORUNUR, ama bu sadece derleme-zamani bir varsayimdir - backend yeni
// bir enum degeri eklerse (orn. ileride "Full") ya da bir seri hallestirme sorunu olursa,
// occupancyStyles[status]/occupancyLabels[status] calisma zamaninda sessizce undefined
// doner ve onu kullanan her yer (className template literal'lari, style.solid) bozuk bir
// gorunume ya da TypeError'a yol acar. Bu, en sik ve en dogrudan kullanilan network
// sinirlarindan biri oldugu icin zod ile calisma-zamaninda dogrulaniyor - .catch('Low')
// beklenmeyen/tanimadigi bir deger geldiginde sessizce guvenli/norotr bir varsayilana
// duser (throw etmez).
const occupancyStatusSchema = z.enum(['Low', 'Medium', 'High']).catch('Low');

// occupancyStyles/occupancyLabels'i DOGRUDAN ham `status` string'i ile degil, bu
// fonksiyonun dondurdugu dogrulanmis degerle indexlemek gerekir.
export function resolveOccupancyStatus(status: string): OccupancyStatus {
  return occupancyStatusSchema.parse(status);
}
