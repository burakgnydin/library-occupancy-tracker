import { memo } from 'react';
import { View } from 'react-native';

import { clampPercentage } from '../utils/occupancy';
import { occupancyStyles, resolveOccupancyStatus } from '../utils/occupancyStyles';
import type { OccupancyStatus } from '../types/library';

interface OccupancyBarProps {
  percentage: number;
  status: OccupancyStatus;
  // Tailwind yukseklik utility'si (orn. "h-2", "h-3") - LibraryCard ile
  // LibraryDetailScreen arasindaki tek fark bu oldugu icin literal string olarak
  // cagiran taraftan birebir gecilir (bkz. occupancyStyles.ts'deki ayni JIT-tarama notu -
  // bu literal'ler cagiran dosyada aynen goründugu surece Tailwind bunlari dogru tespit eder).
  height: string;
}

// LibraryCard ve LibraryDetailScreen'de tekrarlanan doluluk cubugu render mantigi +
// fillPercentage clamp hesaplamasi (bkz. clampPercentage) tek yerde.
function OccupancyBar({ percentage, status, height }: OccupancyBarProps) {
  const fillPercentage = clampPercentage(percentage);
  // resolveOccupancyStatus: `status` derleme-zamaninda OccupancyStatus tipinde gorunse de,
  // nihayetinde bir API response'undan geliyor - bkz. occupancyStyles.ts'teki calisma-zamani
  // dogrulama notu.
  const statusStyle = occupancyStyles[resolveOccupancyStatus(status)];

  return (
    <View className={`overflow-hidden rounded-full bg-border ${height}`}>
      <View className="h-full rounded-full" style={{ width: `${fillPercentage}%`, backgroundColor: statusStyle.solid }} />
    </View>
  );
}

export default memo(OccupancyBar);
