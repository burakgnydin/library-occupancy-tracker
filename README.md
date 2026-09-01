# TraKütüp — Kütüphane Doluluk Takip Sistemi

Kütüphanelerin **anlık doluluk durumunu** takip edilebilir hale getiren, kullanıcıların **QR kod okutarak** check-in / check-out yaptığı, gerçek zamanlı çalışan bir monorepo projesi.

Sistem üç bileşenden oluşur:

| Bileşen | Klasör | Açıklama |
|---|---|---|
| **Backend** | [`backend/`](backend) | .NET 10 ASP.NET Core Web API — kimlik doğrulama, kütüphane/doluluk yönetimi, QR kod üretimi, SignalR ile gerçek zamanlı yayın |
| **Mobil Uygulama** | [`mobile/`](mobile) | Expo (React Native) — kullanıcıların kütüphaneleri arayıp doluluk durumunu gördüğü, QR okutarak check-in/check-out yaptığı istemci |
| **Web Yönetim Paneli** | [`web/`](web) | React + Vite — kütüphane ve personel yönetimi için admin paneli |

Her bileşenin kendi detaylı README'si vardır: **[backend/README.md](backend/README.md)** (mimari, güvenlik, API referansı) ve **[mobile/README.md](mobile/README.md)** (ekranlar, SignalR entegrasyonu, QR akışı). Bu dosya, projeye genel bir bakış ve hızlı başlangıç rehberi sunar.

---

## Sistem Nasıl Çalışır?

1. Bir kütüphane oluşturulduğunda backend, o kütüphaneye özel benzersiz bir **QR kod token'ı** üretir (`QRCoder` ile PNG olarak dışa verilir) ve kütüphanenin fiziksel girişine asılır.
2. Kullanıcı **misafir olarak dahi** mobil uygulama üzerinden kütüphaneleri arayabilir, listede ve detay ekranında **Az / Orta / Çok Yoğun** şeklindeki anlık doluluk durumunu görebilir.
3. Giriş yapmış bir kullanıcı kütüphaneye fiziksel olarak geldiğinde, mobil uygulamadaki kamerayla **QR kodu okutarak check-in** yapar. Kod, sunucuda o kütüphanenin gerçek token'ıyla doğrulanır — istemci tarafında hiçbir doğrulama/karşılaştırma yapılmaz.
4. Check-in başarılı olduğunda kütüphanenin `CurrentOccupancy` değeri +1 artırılır, doluluk yüzdesi yeniden hesaplanır ve **SignalR üzerinden** o kütüphaneyi izleyen tüm bağlı istemcilere (mobil + web) anlık olarak yayınlanır — sayfa yenilemeye gerek kalmadan herkesin ekranı güncellenir.
5. Kullanıcı ayrılırken aynı şekilde QR kodu okutup **check-out** yapar, doluluk -1 azalır.
6. Bir kullanıcı aynı anda yalnızca **tek bir kütüphanede** check-in olabilir; çift check-in veya yanlış kütüphaneden check-out engellenir.

---

## Mimari Genel Bakış

```
                         ┌───────────────────────┐
                         │   backend (.NET 10)   │
                         │  ASP.NET Core Web API  │
                         │  EF Core + SQLite      │
                         │  JWT Auth + SignalR    │
                         └───────────┬────────────┘
                       REST API      │      SignalR (WebSocket)
                    ┌────────────────┼────────────────┐
                    │                                  │
         ┌──────────▼──────────┐          ┌───────────▼───────────┐
         │   mobile (Expo/RN)   │          │    web (React/Vite)    │
         │  Öğrenci/kullanıcı    │          │   Admin/Personel        │
         │  QR ile check-in/out │          │   Kütüphane & personel   │
         │  Anlık doluluk takibi │          │   yönetimi               │
         └───────────────────────┘          └─────────────────────────┘
```

- **Backend**, katmanlı mimari (Controller → Service → Repository) ve Unit of Work deseniyle yazılmıştır; ayrıntılar için [backend/README.md](backend/README.md#mimari) içindeki mimari bölümüne bakın.
- **Mobil uygulama**, giriş yapmamış kullanıcılara da kütüphane arama/görüntüleme izni verir; check-in/check-out gibi kimlik gerektiren eylemler `useRequireAuth` hook'u ile korunur.
- **Web paneli**, `Admin`/`SuperAdmin` rolündeki kullanıcıların kütüphane ve personel (staff) yönetimi yaptığı arayüzdür.

---

## Kullanılan Teknolojiler

**Backend**
- .NET 10 / ASP.NET Core Web API, Entity Framework Core + SQLite
- JWT Bearer (access + refresh token, rotation), BCrypt, Rate Limiting
- SignalR (gerçek zamanlı doluluk yayını), QRCoder (QR kod üretimi)
- AutoMapper, Serilog, Scalar (interaktif API dokümantasyonu)

**Mobil (mobile/)**
- Expo (SDK 54) + React Native + TypeScript, NativeWind (Tailwind)
- Zustand (state), Axios (otomatik refresh-token akışı), expo-secure-store
- `@microsoft/signalr` (gerçek zamanlı güncellemeler), `expo-camera` (QR tarama)

**Web (web/)**
- React 19 + TypeScript + Vite, Tailwind CSS, React Router
- Zustand, Axios, Framer Motion

---

## Rol Hiyerarşisi

| Rol | Yetkiler |
|---|---|
| **SuperAdmin** | Her şeye erişir; tek münhasır yetkisi yeni `Admin`/`User` rolünde staff kullanıcı oluşturmak. |
| **Admin** | Kütüphane yönetimi yapabilir (oluşturma/güncelleme/silme). |
| **User** | Normal kullanıcı; kendi profiline erişir, check-in/check-out yapabilir. |

Rol tabanlı yetkilendirme kuralları, doluluk hesaplama mantığı, JWT/güvenlik detayları ve tam API referansı için bkz. **[backend/README.md](backend/README.md)**.

---

## Kurulum ve Çalıştırma

Projeyi çalıştırmak için üç bileşeni de (aynı makinede, backend'in dinlediği port 5200 sabit kalacak şekilde) ayrı ayrı ayağa kaldırmanız gerekir.

### 1. Backend

```bash
cd backend/LibraryOccupancy.Api
dotnet restore
```

`appsettings.Development.json` dosyasını (git'e dahil değildir) oluşturup `Jwt` ve `InitialAdmin` alanlarını doldurun — detaylar için [backend/README.md → Kurulum](backend/README.md#kurulum).

```bash
dotnet ef database update
dotnet run
```

API varsayılan olarak `http://localhost:5200` üzerinde çalışır; interaktif dokümantasyon `http://localhost:5200/scalar` adresinde.

### 2. Mobil Uygulama

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Geliştirmede `.env` genelde boş bırakılabilir — API adresi Metro'nun bağlı olduğu host'tan otomatik türetilir. Fiziksel cihaz/tünel modu gibi özel durumlar için [mobile/README.md → Kurulum](mobile/README.md#kurulum) bölümüne bakın.

### 3. Web Yönetim Paneli

```bash
cd web
npm install
npm run dev
```

---

## Proje Yapısı

```
library-occupancy-tracker/
├── backend/                  → .NET 10 Web API (LibraryOccupancy.Api)
│   └── README.md              → Mimari, güvenlik, tam API referansı
├── mobile/                   → Expo / React Native istemcisi
│   └── README.md              → Ekranlar, SignalR, QR check-in/out akışı
├── web/                      → React + Vite admin paneli
├── TraKutup_Tanitim_Dokumani.pdf  → Projenin tanıtım dokümanı
└── README.md                 → Bu dosya
```

---


