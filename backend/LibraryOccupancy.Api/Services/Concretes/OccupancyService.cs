using System.Security.Cryptography;
using System.Text;

namespace LibraryOccupancy.Api.Services.Concretes;

public class OccupancyService : IOccupancyService
{
    private readonly ILibraryRepository _libraryRepository;
    private readonly IUserRepository _userRepository;
    private readonly IOccupancyLogRepository _occupancyLogRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<OccupancyHub> _hubContext;
    private readonly ILogger<OccupancyService> _logger;

    public OccupancyService(
        ILibraryRepository libraryRepository,
        IUserRepository userRepository,
        IOccupancyLogRepository occupancyLogRepository,
        IUnitOfWork unitOfWork,
        IHubContext<OccupancyHub> hubContext,
        ILogger<OccupancyService> logger)
    {
        _libraryRepository = libraryRepository;
        _userRepository = userRepository;
        _occupancyLogRepository = occupancyLogRepository;
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<CheckInOutResultDto> CheckInAsync(Guid libraryId, Guid userId, string qrToken)
    {
        var library = await _libraryRepository.GetByIdAsync(libraryId).GetOrThrowAsync("library", libraryId, ErrorCodes.LibraryNotFound);
        await _userRepository.GetByIdNoTrackingAsync(userId).GetOrThrowAsync("user", userId, ErrorCodes.UserNotFound);

        EnsureQrTokenMatches(library, qrToken);

        var latestLog = await _occupancyLogRepository.GetLatestByUserIdAsync(userId);
        if (latestLog is not null && latestLog.Type == OccupancyLogType.CheckIn)
        {
            throw new ValidationException("You are already checked in at another library. Please check out first.", ErrorCodes.AlreadyCheckedIn);
        }

        if (library.CurrentOccupancy >= library.Capacity)
        {
            throw new ValidationException("Library is currently full", ErrorCodes.LibraryFull);
        }

        library.CurrentOccupancy += 1;

        var log = CreateLog(libraryId, userId, OccupancyLogType.CheckIn);
        _occupancyLogRepository.Add(log);

        await _unitOfWork.SaveChangesAsync();

        var result = ToResultDto(library, log);
        await BroadcastOccupancyUpdateAsync(libraryId, result);

        return result;
    }

    public async Task<CheckInOutResultDto> CheckOutAsync(Guid libraryId, Guid userId, string qrToken)
    {
        var library = await _libraryRepository.GetByIdAsync(libraryId).GetOrThrowAsync("library", libraryId, ErrorCodes.LibraryNotFound);
        await _userRepository.GetByIdNoTrackingAsync(userId).GetOrThrowAsync("user", userId, ErrorCodes.UserNotFound);

        EnsureQrTokenMatches(library, qrToken);

        var latestLog = await _occupancyLogRepository.GetLatestByUserIdAsync(userId);
        if (latestLog is null || latestLog.Type != OccupancyLogType.CheckIn)
        {
            throw new ValidationException("You are not checked in anywhere.", ErrorCodes.NotCheckedIn);
        }

        if (latestLog.LibraryId != libraryId)
        {
            throw new ValidationException("You are checked in at a different library. Please check out from there first.", ErrorCodes.CheckedInElsewhere);
        }

        if (library.CurrentOccupancy <= 0)
        {
            throw new ValidationException("Occupancy is already zero", ErrorCodes.OccupancyAlreadyZero);
        }

        library.CurrentOccupancy -= 1;

        var log = CreateLog(libraryId, userId, OccupancyLogType.CheckOut);
        _occupancyLogRepository.Add(log);

        await _unitOfWork.SaveChangesAsync();

        var result = ToResultDto(library, log);
        await BroadcastOccupancyUpdateAsync(libraryId, result);

        return result;
    }

    public async Task<MyCheckInStatusDto> GetMyStatusAsync(Guid userId)
    {
        var latestLog = await _occupancyLogRepository.GetLatestByUserIdAsync(userId);
        if (latestLog is null || latestLog.Type != OccupancyLogType.CheckIn)
        {
            return new MyCheckInStatusDto();
        }

        var library = await _libraryRepository.GetByIdNoTrackingAsync(latestLog.LibraryId);

        return new MyCheckInStatusDto
        {
            LibraryId = latestLog.LibraryId,
            LibraryName = library?.Name,
            CheckedInAt = latestLog.Timestamp
        };
    }

    // Check-in/check-out asil islemi zaten SaveChangesAsync ile commit edildikten
    // SONRA cagrilir (bkz. CheckInAsync/CheckOutAsync) - bu yuzden bildirim
    // katmanindaki bir arizanin (transient SignalR/backplane sorunu) asil,
    // basariyla tamamlanmis islemi 500'e cevirmesine asla izin verilmez. Hata
    // sadece loglanip yutulur - mobil taraftaki signalRService'in ayni "nice to
    // have, REST akisini asla bozmaz" felsefesinin backend karsiligi.
    private async Task BroadcastOccupancyUpdateAsync(Guid libraryId, CheckInOutResultDto result)
    {
        try
        {
            await _hubContext.Clients.Group(OccupancyHub.GroupName(libraryId)).SendAsync("OccupancyUpdated", result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast occupancy update for library {LibraryId}", libraryId);
        }
    }

    private static void EnsureQrTokenMatches(Library library, string qrToken)
    {
        if (!QrTokensMatch(library.QrCodeToken, qrToken))
        {
            throw new ValidationException("Invalid QR code for this library.", ErrorCodes.InvalidQrCode);
        }
    }

    // Timing-safe comparison (CryptographicOperations.FixedTimeEquals) instead of plain string
    // equality - a naive != short-circuits on the first mismatching byte, and the resulting
    // timing difference is (in principle) enough for an attacker to guess a valid QR token one
    // byte at a time. The length check below returns early on mismatch, but leaking length alone
    // isn't meaningful here (every token is a fixed-length GUID string).
    private static bool QrTokensMatch(string expected, string actual)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var actualBytes = Encoding.UTF8.GetBytes(actual);

        return expectedBytes.Length == actualBytes.Length &&
            CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }

    private static OccupancyLog CreateLog(Guid libraryId, Guid userId, OccupancyLogType type)
    {
        return new OccupancyLog
        {
            LibraryId = libraryId,
            UserId = userId,
            Type = type
        };
    }

    private static CheckInOutResultDto ToResultDto(Library library, OccupancyLog log)
    {
        var occupancyPercentage = OccupancyCalculator.CalculatePercentage(library.CurrentOccupancy, library.Capacity);

        return new CheckInOutResultDto
        {
            LibraryId = library.Id,
            CurrentOccupancy = library.CurrentOccupancy,
            Capacity = library.Capacity,
            OccupancyPercentage = occupancyPercentage,
            OccupancyStatus = OccupancyCalculator.CalculateStatus(occupancyPercentage),
            Type = log.Type,
            Timestamp = log.Timestamp
        };
    }
}
