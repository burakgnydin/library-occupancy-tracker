# TraKütüp — Mobile

Kütüphane doluluk takip sisteminin mobil istemcisi. Kullanıcılar giriş yapmadan da kütüphaneleri arayabilir, sayfalı listede ve detay ekranında doluluk durumlarını (Az/Orta/Çok yoğun) **gerçek zamanlı** görebilir; giriş yaptıklarında ise QR kod okutarak check-in/check-out yapabilirler. Backend'i ayrı bir dizinde bulunan ASP.NET Core API'dir (`../backend`).

## Kullanılan Teknolojiler

- **Expo** (SDK 54) + **React Native** + **TypeScript**
- **NativeWind** — Tailwind CSS syntax'ını React Native'e taşıyan stil kütüphanesi
- **Zustand** — hafif state yönetimi (`authStore`)
- **Axios** — HTTP istemcisi (timeout, 401 sonrası otomatik refresh-token akışı)
- **expo-secure-store** — JWT/refresh token'ların native (iOS/Android) şifrelenmiş depolanması
- **@react-navigation** (native-stack) — tek stack üzerinden misafir/giriş yapmış kullanıcı gezinmesi (bkz. [Ekranlar ve Navigasyon](#ekranlar-ve-navigasyon))
- **@microsoft/signalr** — backend'deki SignalR hub'ına bağlanıp doluluk güncellemelerini gerçek zamanlı dinleme (bkz. [Gerçek Zamanlı Güncellemeler](#gerçek-zamanlı-güncellemeler-signalr))
- **expo-camera** — QR kod tarama (bkz. [QR Kod ile Check-in/Check-out](#qr-kod-ile-check-incheck-out))
- **@expo/vector-icons** (Ionicons)

## Proje Yapısı

```
src/
  screens/        → LoginScreen, RegisterScreen, LibraryListScreen, LibraryDetailScreen, QrScannerScreen
  components/     → FormInput, PrimaryButton, LibraryCard (React.memo), AuthHeaderStatus
  hooks/          → useRequireAuth — misafir kullanıcıyı kilitli bir eylemden önce Login'e yönlendirir
  services/       → apiClient (axios + refresh akışı), authService, libraryService, secureStorage, signalRService
  store/          → authStore (zustand) — tek hata kaynağı, session yönetimi
  types/          → auth.ts, library.ts — backend DTO'larıyla birebir
  navigation/     → AppNavigator — tek stack (Libraries kök ekran, Login/Register/QrScanner üstüne açılır)
  theme/          → colors.ts (tailwind.config.js ile birebir aynı tutulmalı)
  utils/          → apiError.ts, occupancyStyles.ts, apiBaseUrl.ts (Metro host'undan otomatik API adresi türetme)
```

## Ekranlar ve Navigasyon

Tek bir stack (`AppNavigator`) var — `Libraries` (kütüphane listesi) her zaman kök ekran; `LibraryDetail`, `Login`, `Register` ve `QrScanner` bunun üzerine push/modal olarak açılır. `isAuthenticated` artık "hangi stack gösterilecek" değil, "hangi eylemlere izin var" sorusuna cevap verir:

| Ekran | Erişim | Açıklama |
|---|---|---|
| `LibraryListScreen` | Misafir dahil herkes | Arama + sayfalama, doluluk durumları gerçek zamanlı güncellenir |
| `LibraryDetailScreen` | Misafir dahil herkes | Tek kütüphanenin detayı, doluluk durumu, check-in/check-out butonu |
| `QrScannerScreen` | Giriş yapmış kullanıcı | Kamera ile QR kod okutma (bkz. [QR Kod ile Check-in/Check-out](#qr-kod-ile-check-incheck-out)) |
| `LoginScreen` / `RegisterScreen` | Misafir | Modal olarak mevcut ekranın üzerine açılır |

**Misafir gezinme + kilitli eylemler:** Kütüphaneleri arama/görüntüleme giriş gerektirmez. Check-in/check-out gibi kimlik gerektiren bir eylem, `src/hooks/useRequireAuth.ts` üzerinden korunur — kullanıcı giriş yapmamışsa eylem çalıştırılmaz, `Login` ekranına (bilgilendirici bir mesajla) yönlendirilir; giriş yapmışsa eylem doğrudan çalışır. Login ekranı her zaman mevcut ekranın üzerine açıldığı için geri gitmek (swipe/back) kullanıcıyı otomatik olarak kaldığı yere döndürür, ayrı bir "returnTo" mekanizmasına gerek yoktur.

## Gerçek Zamanlı Güncellemeler (SignalR)

`src/services/signalRService.ts`, uygulama boyunca **tek bir paylaşılan** `HubConnection` tutar (backend'in `/hubs/occupancy` hub'ına bağlanır) — ekranlar arası navigasyonda bağlantı tekrar tekrar kurulup kapatılmaz, sadece grup üyelikleri ekran yaşam döngüsüne göre yönetilir:

- `LibraryListScreen` ve `LibraryDetailScreen`, `useFocusEffect` ile odaklandıklarında görüntüledikleri kütüphane(ler) için `joinLibraryGroup`/`leaveLibraryGroup` çağırır ve `onOccupancyUpdated` ile dinleyici ekler/kaldırır — ekrandan çıkıldığında hem gruptan ayrılınır hem dinleyici kaldırılır (memory leak yok).
- **Otomatik reconnect + grup yeniden katılımı:** Bağlantı koparsa (`withAutomaticReconnect`) otomatik yeniden bağlanma denenir; bu deneme tükenip bağlantı tamamen kapanırsa (`onclose`), bir sonraki ekran odaklanmasında servis gerçek bir yeni bağlantı kurar (önceki bir "ölü" bağlantıya sessizce takılı kalınmaz). Bağlantı yeniden kurulduğunda (`onreconnected`), servis o ana kadar katılınmış tüm grupları (`activeGroupIds`) otomatik olarak yeniden katılır — ekranların bunun için ek bir şey yapması gerekmez.
- Bu katman "nice to have" — REST akışı buna hiç bağımlı değildir. Hiçbir hata dışarıya fırlatılmaz, sessizce `console.warn` ile loglanıp devam edilir; ekranlar odaklandıklarında ayrıca sessiz bir REST yenilemesi (`fetchPage(1, 'silent')` / `load()`) yaparak SignalR'ın kaçırmış olabileceği güncellemeleri de yakalar.

## QR Kod ile Check-in/Check-out

1. `LibraryDetailScreen`'de giriş yapmış kullanıcı check-in/check-out butonuna basar (`useRequireAuth` ile korunur) → `QrScannerScreen`'e yönlendirilir.
2. `QrScannerScreen`, `expo-camera`'nın `useCameraPermissions` hook'uyla kamera izni ister; izin yoksa/daha önce reddedilmişse uygun bir izin ekranı (gerekirse "Ayarları Aç" ile sistem ayarlarına yönlendirme) gösterir.
3. Kamera açıldığında okunan QR kodun ham değeri **doğrulanmadan** doğrudan `LibraryDetailScreen`'e taşınır — beklenen değer mobil tarafta hiç bilinmez, karşılaştırma sadece backend'de yapılır (bkz. `backend/README.md` → Güvenlik → QR Kod Doğrulaması).
4. Ekranlar arası dönüş `navigation.navigate()` yerine `navigation.popTo()` ile yapılır: `navigate()`, hedef ekran stack'te bitişik olmayan bir konumdaysa (List → Detail → Scanner gibi) mevcut `LibraryDetail` instance'ına dönmek yerine yeni bir instance push edebiliyordu — bu da ekran state'inin sıfırlanmasına yol açıyordu. `popTo()` açıkça "stack'teki mevcut ekrana dön" davranışını garanti eder.
5. `LibraryDetailScreen`, taranan token'ı backend'e `checkIn(libraryId, qrToken)` / `checkOut(libraryId, qrToken)` ile gönderir. Backend token'ı doğrulayıp reddederse (`400`), hata backend'in döndürdüğü mesajla ekrandaki geri bildirim banner'ında gösterilir.

## Kurulum

```bash
npm install
```

`.env` dosyası oluştur (`.env.example`'ı kopyala):

```bash
cp .env.example .env
```

**Geliştirmede `EXPO_PUBLIC_API_BASE_URL`'i genelde elle ayarlamana gerek yok.** `src/utils/apiBaseUrl.ts`, backend'in adresini Metro'nun bağlı olduğu host'tan otomatik türetir — LAN'da fiziksel cihaz/Expo Go bağlanırken kullanılan IP, Android emulator'de `10.0.2.2`, web preview'da `window.location.hostname` neyse API adresi de otomatik ona göre ayarlanır (backend her zaman Metro'yla aynı makinede, sabit `5200` portunda çalıştığı varsayılır). `.env` boş bırakılabilir; `EXPO_PUBLIC_API_BASE_URL` açıkça doldurulmuşsa her zaman o öncelikli kabul edilir.

Manuel ayar sadece şu durumlarda gerekir:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:5200/api
```

- **Tünel modu** (`npx expo start --tunnel`): Metro'ya ngrok üzerinden uzak bir adresten erişilir, ama backend o tünel adresinde çalışmaz — otomatik türetme bu modda yanlış bir adrese işaret eder (bir uyarı loglanır), IP'yi manuel yazmak şarttır.
- **Backend başka bir makinede çalışıyorsa** (Metro'yu çalıştıran bilgisayardan farklı).
- **Production build** (EAS/standalone) — Metro host bilgisi hiçbir zaman mevcut olmadığından, gerçek domain/cloud adresi tek kaynak olarak `EXPO_PUBLIC_API_BASE_URL`'den okunur.

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
