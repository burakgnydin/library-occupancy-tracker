using Microsoft.Extensions.Options;

namespace LibraryOccupancy.Api.Services.Concretes;

// Revoke edilmis (IsRevoked=true) veya suresi gecmis (ExpiresAt < now) RefreshToken
// kayitlari zamanla DB'de birikir (bkz. backend CLAUDE.md "Bekleyen Isler" notu - bu
// servis tam olarak o eksikligi kapatmak icin yazildi). Periyodik olarak (varsayilan
// gunde bir kez, appsettings'teki RefreshTokenCleanup:IntervalMinutes ile konfigure
// edilebilir) bunlari RefreshTokenRepository.DeleteExpiredOrRevokedAsync() ile
// dogrudan SQL DELETE olarak siler.
//
// BackgroundService singleton yasam suresine sahip oldugu icin scoped servisleri
// (repository/DbContext) doğrudan constructor'a enjekte edemez - her calismada
// IServiceScopeFactory ile kendi scope'unu acar/kapatir (ASP.NET Core'un standart
// "scoped servisi singleton bir hosted service'ten kullanma" deseni).
public class RefreshTokenCleanupBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupBackgroundService> _logger;
    private readonly TimeSpan _interval;

    public RefreshTokenCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<RefreshTokenCleanupSettings> settings,
        ILogger<RefreshTokenCleanupBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _interval = TimeSpan.FromMinutes(settings.Value.IntervalMinutes);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await RunCleanupAsync();

            try
            {
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Uygulama kapatiliyor - beklenen durum, tekrar firlatmaya gerek yok.
            }
        }
    }

    private async Task RunCleanupAsync()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var refreshTokenRepository = scope.ServiceProvider.GetRequiredService<IRefreshTokenRepository>();

            var deletedCount = await refreshTokenRepository.DeleteExpiredOrRevokedAsync();
            if (deletedCount > 0)
            {
                _logger.LogInformation("Refresh token cleanup removed {Count} expired/revoked token(s).", deletedCount);
            }
        }
        catch (Exception ex)
        {
            // Bu "nice to have" bir bakim islemi - bir calisma basarisiz olursa (orn. gecici
            // bir DB kilidi) uygulamayi cokertmeden loglayip bir sonraki interval'de tekrar
            // denenir.
            _logger.LogError(ex, "Refresh token cleanup run failed.");
        }
    }
}
