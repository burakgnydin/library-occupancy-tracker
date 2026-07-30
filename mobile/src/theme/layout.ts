// Bu projenin responsive tasarim kurali icin referans tablet breakpoint'i (bkz. CLAUDE.md).
// Sayisal deger - useWindowDimensions().width ile JS tarafinda karsilastirilir, bir
// className'e gomulmez.
export const TABLET_BREAKPOINT = 768;

// Tam ekran icerik bloklarinin (Login/Register/StatusScreen, LibraryDetailScreen) tablette
// gerilmemesi icin kullanilan maksimum genislik sinirlari (bkz. CLAUDE.md responsive kurali).
//
// Sayisal bir degerden ("480") DEGIL, Tailwind'in arbitrary-value class fragmani olarak
// ("max-w-[480px]") tutuluyor: NativeWind'in JIT tarayicisi class isimlerini derleme
// zamaninda kaynak metninde literal olarak arar - `max-w-[${480}px]` gibi runtime'da
// birlestirilen bir string'i GOREMEZ ve stil sessizce uygulanmaz (bkz. occupancyStyles.ts
// ve OccupancyBar.tsx'teki ayni not). Bu sabitler literal string olarak burada durdugu
// surece JIT bu dosyayi da (src/**/*.ts) taradigi icin dogru tespit eder.
export const AUTH_CONTENT_MAX_WIDTH = 'max-w-[480px]';
export const DETAIL_CONTENT_MAX_WIDTH = 'max-w-[640px]';
