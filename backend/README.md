# TraKütüp — LibraryOccupancy.Api

Kütüphane doluluk takip sisteminin backend'i. Kullanıcılar QR kod ile check-in/check-out yaparak kütüphanelerin anlık doluluk durumunu takip edebilir.

## Kullanılan Teknolojiler

- **.NET 10** / ASP.NET Core Web API
- **Entity Framework Core** + **SQLite**
- **AutoMapper** — DTO-Entity dönüşümü
- **BCrypt.Net-Next** — şifre hash'leme
- **QRCoder** — kütüphane QR kod üretimi
- **Serilog** — loglama (console + dosya)
- **Scalar** — interaktif API dokümantasyonu

## Mimari

Katmanlı mimari: **Controller → Service → Repository**

- `Services/` ve `Repositories/` altında `Abstracts/` / `Concretes/` ayrımı
- **Generic Repository**: `IRepository<T>` / `RepositoryBase<T>` — ortak CRUD tüm entity'ler için tek yerden
- **Unit of Work**: `IUnitOfWork.SaveChangesAsync()` — commit sadece Service katmanından, tek noktadan yapılır; repository'ler kendi başına kaydetmez
- **ServiceGuardExtensions.GetOrThrowAsync** — NotFound kontrolü tek bir extension method üzerinden
- Global exception middleware: `NotFoundException` → 404, `ValidationException` → 400, `ConflictException` → 409

```
Controllers/          → HTTP endpoint'leri
Services/
  Abstracts/           → servis arayüzleri
  Concretes/           → servis implementasyonları
Repositories/
  Abstracts/           → repository arayüzleri (IRepository<T> dahil)
  Concretes/           → repository implementasyonları (RepositoryBase<T> dahil)
Models/                → EF Core entity'leri
DTOs/                  → request/response modelleri (entity bazlı klasörler)
Mapping/               → AutoMapper profilleri
Data/                  → ApplicationDbContext, IUnitOfWork/UnitOfWork
Migrations/            → EF Core migration'ları
```

## Kurulum

```bash
dotnet restore
```

`LibraryOccupancy.Api/appsettings.Development.json` dosyası **git'e dahil değildir** (`.gitignore`'da), yerelde manuel oluşturulmalı:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=trakutup.db"
  }
}
```

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

### Library

| Metot | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/libraries` | Tüm kütüphaneleri listele |
| GET | `/api/libraries/{id}` | Tek kütüphane getir |
| POST | `/api/libraries` | Yeni kütüphane oluştur |
| PUT | `/api/libraries/{id}` | Kütüphane bilgilerini güncelle |
| DELETE | `/api/libraries/{id}` | Kütüphaneyi sil |
| GET | `/api/libraries/{id}/qrcode` | Kütüphanenin QR kodunu PNG olarak döndür |

### User

| Metot | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/users/register` | Yeni kullanıcı kaydı |
| GET | `/api/users/{id}` | Kullanıcı bilgisi getir |
| PUT | `/api/users/{id}` | Kullanıcı bilgisi güncelle (FullName) |
| DELETE | `/api/users/{id}` | Kullanıcıyı sil |

### Check-in / Check-out

| Metot | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/libraries/{id}/checkin?userId={userId}` | Kütüphaneye giriş — doluluk +1 |
| POST | `/api/libraries/{id}/checkout?userId={userId}` | Kütüphaneden çıkış — doluluk -1 |

Occupancy güncellemesi ve log kaydı, Unit of Work sayesinde **tek bir transaction** içinde atomik olarak gerçekleşir.

## API Dokümantasyonu (Scalar)

Development ortamında çalışırken interaktif API referansına şuradan erişilebilir:

```
http://localhost:5200/scalar
```

## Bilinen Eksik / Planlı

- **JWT auth henüz eklenmedi.** Şu an tüm endpoint'ler auth'suz erişilebilir; check-in/check-out `userId`'yi query parametresinden alıyor. Auth eklendiğinde bu parametre kaldırılıp kullanıcı kimliği token'dan otomatik okunacak.
