# TraKütüp — LibraryOccupancy.Api

Kütüphane doluluk takip sisteminin backend'i. Kullanıcılar QR kod ile check-in/check-out yaparak kütüphanelerin anlık doluluk durumunu takip edebilir.

> Bu proje bir monorepo'nun parçasıdır: bu dizin (`backend/`) API'yi, kardeş dizin `../mobile` ise React Native/Expo mobil istemciyi içerir (bkz. `mobile/README.md`).

## Kullanılan Teknolojiler

- **.NET 10** / ASP.NET Core Web API
- **Entity Framework Core** + **SQLite**
- **JWT Bearer Authentication** (`Microsoft.AspNetCore.Authentication.JwtBearer`) — access + refresh token
- **Rate Limiting** (`Microsoft.AspNetCore.RateLimiting`, .NET 10 yerleşik) — brute-force koruması
- **AutoMapper** — DTO-Entity dönüşümü
- **BCrypt.Net-Next** — şifre hash'leme
- **QRCoder** — kütüphane QR kod üretimi
- **SignalR** (`Microsoft.AspNetCore.SignalR`) — doluluk değişikliklerinin gerçek zamanlı yayınlanması
- **Serilog** — loglama (console + dosya)
- **Scalar** — interaktif API dokümantasyonu

## Mimari

Katmanlı mimari: **Controller → Service → Repository**

- `Services/` ve `Repositories/` altında `Abstracts/` / `Concretes/` ayrımı
- **Generic Repository**: `IRepository<T>` / `RepositoryBase<T>` — ortak CRUD tüm entity'ler için tek yerden
- **Unit of Work**: `IUnitOfWork.SaveChangesAsync()` — commit sadece Service katmanından, tek noktadan yapılır; repository'ler kendi başına kaydetmez
- **ServiceGuardExtensions.GetOrThrowAsync** — NotFound kontrolü tek bir extension method üzerinden
- **Named Authorization Policy'ler** — rol kontrolü `Authorization/` altında tek bir yerden yönetilir (bkz. [Güvenlik](#güvenlik))
- Global exception middleware: `NotFoundException` → 404, `ValidationException` → 400, `ConflictException` → 409, `UnauthorizedException` → 401, `ForbiddenException` → 403

```
Controllers/           → HTTP endpoint'leri
Authorization/          → Roles / PolicyNames sabitleri, named authorization policy tanımları
Services/
  Abstracts/            → servis arayüzleri
  Concretes/            → servis implementasyonları
  Settings/             → strongly-typed appsettings bölümleri (Jwt, InitialAdmin)
Repositories/
  Abstracts/            → repository arayüzleri (IRepository<T> dahil)
  Concretes/            → repository implementasyonları (RepositoryBase<T> dahil)
Models/                 → EF Core entity'leri
DTOs/                   → request/response modelleri (entity bazlı klasörler)
Mapping/                → AutoMapper profilleri
Data/                   → ApplicationDbContext, IUnitOfWork/UnitOfWork, DatabaseSeeder
Extensions/             → DI/middleware konfigürasyonu (JWT, rate limiting, vb.)
Middleware/             → global exception handling
Migrations/             → EF Core migration'ları
```

## Rol Hiyerarşisi

Üç rol vardır: **`SuperAdmin` > `Admin` > `User`** (varsayılan: `User`).

| Rol | Yetkiler |
|---|---|
| **SuperAdmin** | Her şeye erişebilir. Tek münhasır yetkisi: `POST /api/users/create-staff` ile `Admin` veya `User` rolünde yeni bir staff kullanıcı oluşturmak. `Admin` bunu yapamaz; yeni bir `SuperAdmin` bu endpoint üzerinden **hiçbir şekilde** oluşturulamaz. |
| **Admin** | Kütüphane yönetimi yapabilir (`POST`/`PUT`/`DELETE /api/libraries`). Yeni staff/admin oluşturamaz. |
| **User** | Normal kullanıcı. Sadece kendi profiline erişebilir, check-in/check-out yapabilir. |

### SuperAdmin Bootstrap

Uygulama her başladığında veritabanında `SuperAdmin` rolünde bir kullanıcı olup olmadığı kontrol edilir. Yoksa, `appsettings`'teki `InitialAdmin` bilgileriyle (`FullName`/`Email`/`Password`) idempotent şekilde otomatik bir tane oluşturulur — ilk `SuperAdmin` API üzerinden değil, sadece bu bootstrap mekanizmasıyla oluşur.

## Güvenlik

### JWT Access + Refresh Token
- Login sonrası kısa ömürlü bir **access token** (varsayılan 20 dakika, JWT Bearer) ve uzun ömürlü bir **refresh token** (varsayılan 30 gün) döner.
- Access token, korumalı endpoint'lerde `Authorization: Bearer <token>` header'ı ile kullanılır.
- `/api/auth/refresh` ile yeni bir access + refresh token çifti alınabilir; her refresh'te eski refresh token **rotation** ile iptal edilir (revoke), yenisi üretilir. İptal edilmiş bir token tekrar kullanılmaya çalışılırsa reddedilir.
- Rotation, eşzamanlı isteklere karşı atomik bir koşullu güncelleme (`UPDATE ... WHERE IsRevoked = 0`) ile korunur — aynı token ile aynı anda gelen iki refresh isteğinden yalnızca biri başarılı olabilir.

### Refresh Token Hash'leme
- Refresh token'lar veritabanında **plaintext olarak değil, SHA-256 hash'i** olarak saklanır — şifrelerin BCrypt ile hash'lenmesiyle aynı prensip. İstemciye her zaman orijinal (hash'lenmemiş) değer döner; sunucu sadece hash karşılaştırması yapar. Böylece bir veritabanı sızıntısında refresh token'lar doğrudan kullanılamaz.

### Rate Limiting
- `POST /api/auth/login` IP başına **dakikada 5 deneme** ile sınırlıdır (fixed window, kuyruklama yok). Aşılırsa `429 Too Many Requests` döner — brute-force şifre denemelerine karşı koruma.

### Named Authorization Policy'ler
- Rol kontrolü ham string yerine `Authorization/Roles.cs` ve `Authorization/PolicyNames.cs`'te tanımlı sabitler ve policy'ler ile yapılır: **`StaffOrAbove`** (`Admin` veya `SuperAdmin`), **`SuperAdminOnly`** (sadece `SuperAdmin`).
- Hem `[Authorize(Policy = ...)]` attribute'ları hem de controller içindeki imperative kontroller (`IAuthorizationService.AuthorizeAsync`) aynı policy tanımını kullanır — "kim staff sayılır" kararı tek bir yerden verilir, iki kontrol mekanizması birbirinden asla ayrışmaz.

### QR Kod Doğrulaması
- Check-in/check-out isteğiyle birlikte gönderilen `qrToken`, sunucuda kütüphanenin gerçek `QrCodeToken` değeriyle karşılaştırılır (`OccupancyService.EnsureQrTokenMatches`) — doğrulama **istemciye değil, sunucuya** aittir. Mobil istemci kamerayla okuduğu ham değeri olduğu gibi taşır; eşleşmezse istek `400 Bad Request` (`"Invalid QR code for this library."`) ile reddedilir.
- `QrCodeToken`, `LibraryDto` üzerinden **hiçbir anonim/genel yanıtta** dönmez — `GET /api/libraries`, `GET /api/libraries/{id}` ve kütüphane oluşturma/güncelleme yanıtları dahil. Token'a tek erişim yolu, `GET /api/libraries/{id}/qrcode` üzerinden üretilen PNG görselinin fiziksel olarak kamerayla okunmasıdır.

## İş Kuralları

### Doluluk Yüzdesi ve Durumu
- Her kütüphane için `OccupancyPercentage` (`CurrentOccupancy / Capacity * 100`, yuvarlanmış) ve `OccupancyStatus` otomatik hesaplanır: **Low** (<%60), **Medium** (%60–84), **High** (≥%85). `Capacity` 0 ise güvenli şekilde `0` / `Low` döner (bölme hatası yok). Hem `GET /api/libraries` yanıtında hem check-in/check-out yanıtında (`CheckInOutResultDto`) yer alır.

### Çift Check-in Koruması
- Bir kullanıcının en güncel işlemi check-in ise (henüz check-out yapmadıysa), aynı veya farklı bir kütüphaneye tekrar check-in yapamaz.
- Check-out, yalnızca en son check-in yapılan kütüphaneden yapılabilir; farklı bir kütüphaneden check-out denenirse veya aktif bir check-in yoksa istek `400` ile reddedilir.

### Kütüphane Benzersizliği (Name + Address)
- Aynı isim **ve** aynı adrese sahip bir kütüphane zaten varsa, yeni kayıt oluşturma (`POST`) veya güncelleme (`PUT`) `409 Conflict` ile reddedilir. Sadece isim veya sadece adres aynıysa engel yoktur (farklı şehirlerde aynı isimli kütüphane olabilir).
- Kontrol iki seviyede uygulanır:
  1. **App seviyesi** — istek işlenmeden önce hızlı bir kontrol yapılır (dostane hata mesajı için).
  2. **DB seviyesi** — `Libraries` tablosunda `(Name, Address)` üzerinde composite UNIQUE index vardır; eşzamanlı isteklerde app seviyesi kontrolü atlatılsa bile veritabanı garantör olarak devreye girer, oluşan constraint ihlali de aynı `409 Conflict`'e çevrilir.

## Gerçek Zamanlı Özellikler

- Bir check-in/check-out başarıyla tamamlandığında (yani `IUnitOfWork.SaveChangesAsync()` ile **commit edildikten SONRA**), `OccupancyService` `IHubContext<OccupancyHub>` üzerinden `library-{libraryId}` grubundaki tüm bağlı istemcilere `OccupancyUpdated` event'i (`CheckInOutResultDto` payload'ıyla) yayınlar. Commit-önce-yayın sırası bilinçli: istemcilere asla veritabanına yazılmamış/geri alınmış bir değişiklik hakkında bilgi gitmez.
- Hub (`/hubs/occupancy`) kimlik doğrulaması gerektirmez — kütüphane listesi/detayı gibi anonim erişimle tutarlı olacak şekilde, giriş yapmamış misafir kullanıcılar da canlı doluluk güncellemesi alabilir.
- **Bildirim hataları asıl işlemi etkilemez:** yayın çağrısı (`BroadcastOccupancyUpdateAsync`) `try/catch` ile izole edilmiştir — transient bir SignalR/backplane hatası oluşursa sadece loglanır (`ILogger`), asla yukarı fırlatılmaz. Check-in/check-out işlemi zaten commit edildiği için HTTP yanıtı her zaman `200 OK` döner; bildirim katmanındaki bir arıza istemciye asla "işlem başarısız" gibi yanlış bir sinyal vermez.

## Kurulum

```bash
dotnet restore
```

`LibraryOccupancy.Api/appsettings.Development.json` dosyası **git'e dahil değildir** (`.gitignore`'da), yerelde manuel oluşturulmalı:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=trakutup.db"
  },
  "Jwt": {
    "Key": "<en az 32 karakter, rastgele üretilmiş bir secret>",
    "Issuer": "TraKutup.Api",
    "Audience": "TraKutup.Client",
    "AccessTokenExpiryMinutes": 20,
    "RefreshTokenExpiryDays": 30
  },
  "InitialAdmin": {
    "FullName": "Super Admin",
    "Email": "superadmin@example.com",
    "Password": "<güçlü bir şifre>"
  }
}
```

> **Önemli:** `Jwt` ve `InitialAdmin` bölümleri **doldurulmadan uygulama açılmaz.** `appsettings.json`'daki `CHANGE_ME` placeholder'ları (veya 32 karakterden kısa bir `Jwt:Key`) tespit edilirse uygulama başlangıçta açık bir hata ile durur — sessizce yanlış/güvensiz bir değerle çalışmaz (fail-fast). `InitialAdmin` boş bırakılırsa sadece SuperAdmin bootstrap'ı atlanır (uygulama yine açılır), ama bu durumda ilk `SuperAdmin`'i oluşturmanın API üzerinden bir yolu yoktur.

Veritabanını oluştur:

```bash
dotnet ef database update
```

Uygulamayı çalıştır:

```bash
dotnet run
```

API varsayılan olarak **http://localhost:5200** üzerinde ayağa kalkar.

## API Endpoint'leri

### Auth

| Metot | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| POST | `/api/auth/login` | Email/şifre ile giriş; access + refresh token döner | Anonim (dakikada 5 istek/IP ile sınırlı) |
| POST | `/api/auth/refresh` | Refresh token ile yeni access + refresh token çifti al (rotation) | Anonim |
| POST | `/api/auth/logout` | Refresh token'ı iptal et (revoke) | Anonim |

### User

| Metot | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| POST | `/api/users/register` | Yeni kullanıcı kaydı (rol: `User`) | Anonim |
| POST | `/api/users/create-staff` | `Admin` veya `User` rolünde staff kullanıcı oluştur | `SuperAdmin` |
| GET | `/api/users/{id}` | Kullanıcı bilgisi getir | Giriş yapmış — sadece kendisi, veya `Admin`/`SuperAdmin` |
| PUT | `/api/users/{id}` | Kullanıcı bilgisi güncelle (`FullName`) | Giriş yapmış — sadece kendisi, veya `Admin`/`SuperAdmin` |
| DELETE | `/api/users/{id}` | Kullanıcıyı sil | Giriş yapmış — sadece kendisi, veya `Admin`/`SuperAdmin` |

### Library

| Metot | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| GET | `/api/libraries` | Kütüphaneleri filtrele/sayfala (bkz. aşağıdaki query parametreleri) | Anonim |
| GET | `/api/libraries/{id}` | Tek kütüphane getir | Anonim |
| POST | `/api/libraries` | Yeni kütüphane oluştur | `Admin` veya `SuperAdmin` |
| PUT | `/api/libraries/{id}` | Kütüphane bilgilerini güncelle | `Admin` veya `SuperAdmin` |
| DELETE | `/api/libraries/{id}` | Kütüphaneyi sil | `Admin` veya `SuperAdmin` |
| GET | `/api/libraries/{id}/qrcode` | Kütüphanenin QR kodunu PNG olarak döndür | Anonim |

`GET /api/libraries` query parametreleri:

| Parametre | Açıklama | Varsayılan |
|---|---|---|
| `Search` | Kütüphane adında kısmi arama (case-insensitive) | — |
| `City` | Şehre göre kısmi filtre (case-insensitive) | — |
| `District` | İlçeye göre kısmi filtre (case-insensitive) | — |
| `PageNumber` | Sayfa numarası (1'den küçükse 1'e sabitlenir) | `1` |
| `PageSize` | Sayfa boyutu (maksimum 50'ye sabitlenir) | `10` |
| `SortBy` | `name` veya `occupancy` | `name` |
| `SortDescending` | Azalan sıralama (`true`/`false`) | `false` |

Yanıt `PagedResultDto<LibraryDto>` şeklindedir: `items`, `totalCount`, `pageNumber`, `pageSize`, `totalPages`.

### Check-in / Check-out

| Metot | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| GET | `/api/libraries/checkin-status` | Giriş yapmış kullanıcının şu an check-in olduğu kütüphaneyi (varsa) döndürür | Giriş yapmış herhangi bir kullanıcı |
| POST | `/api/libraries/{id}/checkin` | Kütüphaneye giriş — doluluk +1. Body: `{ "qrToken": "<QR koddan okunan değer>" }` | Giriş yapmış herhangi bir kullanıcı |
| POST | `/api/libraries/{id}/checkout` | Kütüphaneden çıkış — doluluk -1. Body: `{ "qrToken": "<QR koddan okunan değer>" }` | Giriş yapmış herhangi bir kullanıcı |

Kullanıcı kimliği artık query parametresinden değil, JWT'deki `ClaimTypes.NameIdentifier` claim'inden okunur — bir kullanıcı yalnızca kendi adına check-in/check-out yapabilir. Occupancy güncellemesi ve log kaydı, Unit of Work sayesinde **tek bir transaction** içinde atomik olarak gerçekleşir.

`checkin`/`checkout` artık body'de bir `qrToken` alanı **gerektirir** — sunucu bunu kütüphanenin gerçek QR kod değeriyle karşılaştırır, eşleşmezse `400` döner (bkz. [Güvenlik → QR Kod Doğrulaması](#qr-kod-doğrulaması)).

### Gerçek Zamanlı (SignalR)

| Tip | Adres | Açıklama |
|---|---|---|
| Hub | `/hubs/occupancy` | Doluluk değişikliklerinin anlık yayınlandığı SignalR hub'ı — kimlik doğrulaması gerektirmez |

| Hub Metodu | Parametre | Açıklama |
|---|---|---|
| `JoinLibraryGroup` | `libraryId: Guid` | Çağıran bağlantıyı ilgili kütüphanenin güncelleme grubuna ekler |
| `LeaveLibraryGroup` | `libraryId: Guid` | Çağıran bağlantıyı gruptan çıkarır |

Bir client bir gruba katıldıktan sonra, o kütüphanede check-in/check-out olduğunda `OccupancyUpdated` event'i (`CheckInOutResultDto` payload'ıyla) alır (bkz. [Gerçek Zamanlı Özellikler](#gerçek-zamanlı-özellikler)).

## API Dokümantasyonu (Scalar)

Development ortamında çalışırken interaktif API referansına şuradan erişilebilir (sağ üstteki **Authorize** ile `Bearer <accessToken>` girilerek korumalı endpoint'ler test edilebilir):

```
http://localhost:5200/scalar
```

## Bilinen Eksik / Planlı

- Türkçe hata mesajı/yorum kalıntılarının İngilizce'ye çevrilmesi — kod tabanı genelinde toplu bir temizlik planlanıyor.
- Revoke edilmiş/süresi dolmuş refresh token'lar için periyodik bir temizlik job'ı yok, veritabanında birikiyor.
