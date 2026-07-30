// Backend'den gelen occupancyPercentage teorik olarak her zaman 0-100 araliginda olmali,
// ama render tarafinda (OccupancyBar) genislik yuzdesi olarak kullanilirken bir clamp
// katmani olmadan gecici bir tutarsizlik (orn. eszamanli check-in/check-out sirasinda
// gorulen bir ara deger) cubugun tasmasina/negatif genislige yol acabilir.
export function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}
