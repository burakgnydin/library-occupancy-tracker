# TraKütüp — Mobile

Kütüphane doluluk takip sisteminin mobil istemcisi. Kullanıcılar giriş yapıp kütüphaneleri arayabilir, sayfalı listede doluluk durumlarını (Az/Orta/Çok yoğun) görebilir. Backend'i ayrı bir dizinde bulunan ASP.NET Core API'dir (`../backend`).

## Kullanılan Teknolojiler

- **Expo** (SDK 54) + **React Native** + **TypeScript**
- **NativeWind** — Tailwind CSS syntax'ını React Native'e taşıyan stil kütüphanesi
- **Zustand** — hafif state yönetimi (`authStore`)
- **Axios** — HTTP istemcisi (timeout, 401 sonrası otomatik refresh-token akışı)
- **expo-secure-store** — JWT/refresh token'ların native (iOS/Android) şifrelenmiş depolanması
- **@react-navigation** (native-stack) — auth/app stack geçişleri
- **@expo/vector-icons** (Ionicons)

## Proje Yapısı

```
src/
  screens/        → LoginScreen, RegisterScreen, LibraryListScreen
  components/     → FormInput, PrimaryButton, LibraryCard (React.memo)
  services/       → apiClient (axios + refresh akışı), authService, libraryService, secureStorage
  store/          → authStore (zustand) — tek hata kaynağı, session yönetimi
  types/          → auth.ts, library.ts — backend DTO'larıyla birebir
  navigation/     → AppNavigator (Auth stack / App stack)
  theme/          → colors.ts (tailwind.config.js ile birebir aynı tutulmalı)
  utils/          → apiError.ts, occupancyStyles.ts
```

## Kurulum

```bash
npm install
```

`.env` dosyası oluştur (`.env.example`'ı kopyala):

```bash
cp .env.example .env
```

`EXPO_PUBLIC_API_BASE_URL` değerini backend'in adresine göre ayarla:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5200/api
```

> Fiziksel cihazda (Expo Go) veya Android emulator'de `localhost` bilgisayarın kendisine değil cihaza işaret eder — bilgisayarın yerel ağ IP'sini (`ipconfig` ile bulunur) kullanmak gerekir, örn. `http://192.168.1.23:5200/api`. Android emulator'de özel olarak `10.0.2.2` host makineye karşılık gelir. Bu sadece geliştirme içindir — production'da gerçek bir domain/cloud adresi kullanılacaktır.

Çalıştır:

```bash
npx expo start
```

Web preview için `w` tuşuna bas, fiziksel cihaz için QR kodu Expo Go ile okut.

## Geliştirme Notları

- **Web preview'da SecureStore yok:** `expo-secure-store` web'de desteklenmiyor (native modülü boş). `src/services/secureStorage.ts`, `Platform.OS === 'web'` olduğunda otomatik olarak `localStorage`'a düşer. Bu fallback **şifrelenmemiştir** — sadece web preview/geliştirme kolaylığı içindir, gerçek kullanıcılar her zaman native SecureStore üzerinden geçer.
- **Fiziksel cihazda tünel modu gerekebilir:** Telefon ile bilgisayar aynı Wi-Fi'da olsa bile (özellikle iOS'ta "Yerel Ağ" izni kapalıysa, ya da ağda cihaz izolasyonu varsa) normal (LAN) mod bağlanamayabilir. Bu durumda `npx expo start --tunnel` kullanılabilir — bundle internet üzerinden (ngrok) servis edilir. Not: `.env`'deki API adresi yine de bilgisayarın **yerel ağ IP'si** olmalı (tünel sadece Metro/bundle trafiği için, API çağrıları için değil).
- **Backend CORS:** Web preview'ın (farklı bir origin/port'tan, örn. `localhost:8081` veya `8099`) backend'e istek atabilmesi için backend'de geliştirme ortamında tüm `localhost`/`127.0.0.1` origin'lerine izin veren esnek bir CORS politikası vardır (bkz. backend `ServiceCollectionExtensions.AddFrontendCors`). Production'da bu politika devre dışıdır, sadece açıkça yapılandırılmış origin'lere izin verilir.
- **Backend Firewall/Binding:** Fiziksel cihazdan bağlanabilmek için backend'in `0.0.0.0` üzerinde dinlemesi (sadece `localhost` değil) ve Windows Firewall'da ilgili portun (varsayılan 5200) gelen bağlantılara açık olması gerekir — aksi halde istek backend'e hiç ulaşmaz (network hatası, CORS hatası değil).

## Tasarım Standartları ve Responsive/Tablet Desteği

(Tam kurallar için bkz. `CLAUDE.md` — gitignore'da, repo'ya dahil değil.)

- Tutarlı renk paleti (`theme/colors.ts` + `tailwind.config.js`), yeterli boşluk, net tipografi hiyerarşisi, her ekranda loading/error/empty state.
- **Tüm ekranlar hem telefon hem tablet boyutlarında düzgün görünmeli.** Sabit piksel yerine Flexbox ve esnek boyutlandırma kullanılır.
- Tablet breakpoint referansı: **768px** genişlik (`useWindowDimensions` ile kontrol edilir).
- `LibraryListScreen`, tablet genişliğinde (≥768px) tek sütun yerine 2 sütunlu bir grid'e geçer (`numColumns`).
- Login/Register formları geniş ekranlarda "gerilmez" — içerik `max-w-[480px]` ile sınırlanıp ortalanır.

## Bilinen Eksik / Planlı

- LAN modunda (tünelsiz) bazı ağ yapılandırmalarında bağlantı sorunu yaşanabiliyor — kök neden genelde iOS "Yerel Ağ" izni veya ağ cihaz izolasyonu, tünel modu güvenilir bir alternatif.
- Network sınırında (axios yanıtları için) runtime şema doğrulaması yok — şu an sadece derleme-zamanı TypeScript tipleri güveniliyor.
