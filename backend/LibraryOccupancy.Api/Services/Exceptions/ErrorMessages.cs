namespace LibraryOccupancy.Api.Services.Exceptions;

// ErrorCode -> kullaniciya (mobil/web) donen TURKCE mesaj eslemesi. Exception'in
// kendi Message'i (Ingilizce, gelistirici/log icin) burada KULLANILMAZ - HTTP
// response body'sinde SADECE buradaki metinler gorunur.
//
// Bilerek appsettings.json yerine kod icinde (ErrorCodes.cs ile ayni dosyada/
// klasorde) tutuluyor: bu satirlar ortam bazli degisen bir "konfigurasyon"
// degil, koda sikica bagli sabit urun metni - IDE'nin "kullanilmayan const"
// veya "typo'lu key" gibi uyarilarini/refactor araclarini appsettings.json'a
// gore çok daha güvenilir sekilde kullanabilmemizi sagliyor, ayrica ayri bir
// IOptions/IConfiguration baglama katmani gerektirmiyor.
public static class ErrorMessages
{
    public const string Fallback = "Beklenmeyen bir hata oluştu.";

    private static readonly Dictionary<string, string> Messages = new()
    {
        [ErrorCodes.LibraryNotFound] = "Kütüphane bulunamadı.",
        [ErrorCodes.UserNotFound] = "Kullanıcı bulunamadı.",

        [ErrorCodes.LibraryNameAddressConflict] = "Bu isim ve adrese sahip bir kütüphane zaten mevcut.",
        [ErrorCodes.EmailAlreadyRegistered] = "Bu e-posta adresi zaten kayıtlı.",

        [ErrorCodes.InvalidCredentials] = "E-posta veya şifre hatalı.",
        [ErrorCodes.InvalidRefreshToken] = "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",

        [ErrorCodes.AlreadyCheckedIn] = "Başka bir kütüphaneye zaten giriş yaptınız. Lütfen önce çıkış yapın.",
        [ErrorCodes.LibraryFull] = "Kütüphane şu anda dolu.",
        [ErrorCodes.NotCheckedIn] = "Herhangi bir yerde giriş kaydınız yok.",
        [ErrorCodes.CheckedInElsewhere] = "Farklı bir kütüphaneye giriş yapmışsınız. Lütfen önce oradan çıkış yapın.",
        [ErrorCodes.OccupancyAlreadyZero] = "Doluluk zaten sıfır.",
        [ErrorCodes.InvalidQrCode] = "Bu kütüphane için geçersiz QR kod.",

        [ErrorCodes.CannotCreateSuperAdmin] = "Bu uç nokta üzerinden Süper Yönetici oluşturulamaz.",
        [ErrorCodes.CannotChangeOwnRole] = "Kendi rolünüzü değiştiremezsiniz.",
        [ErrorCodes.CannotDeleteOwnAccount] = "Kendi hesabınızı silemezsiniz.",
        [ErrorCodes.ProfileAccessDenied] = "Sadece kendi profilinize erişebilirsiniz.",
    };

    // Mapping'de karsiligi olmayan (ya da bilinmeyen) bir ErrorCode icin genel
    // Turkce fallback - bu asla olmamali (her ErrorCodes alani burada da
    // karsiligini bulmali) ama sessizce bos/Ingilizce bir mesaj donmek yerine
    // en azindan anlasilir bir Turkce metin gostermeyi garanti eder.
    public static string Resolve(string errorCode)
    {
        return Messages.TryGetValue(errorCode, out var message) ? message : Fallback;
    }
}
