namespace LibraryOccupancy.Api.Services.Settings;

public class RefreshTokenCleanupSettings
{
    public const string SectionName = "RefreshTokenCleanup";

    // Dakika cinsinden (saat degil) - varsayilan 1440 (24 saat) ile ayni gercek dunya
    // davranisini korurken, test/gelistirme ortaminda pratik olarak test edilebilir
    // kisa araliklari (orn. 1) da mumkun kilar.
    public int IntervalMinutes { get; set; } = 1440;
}
