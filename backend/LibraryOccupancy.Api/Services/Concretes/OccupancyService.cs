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
        var library = await _libraryRepository.GetByIdAsync(libraryId).GetOrThrowAsync("kütüphane", libraryId);
        await _userRepository.GetByIdAsync(userId).GetOrThrowAsync("user", userId);

        EnsureQrTokenMatches(library, qrToken);

        var latestLog = await _occupancyLogRepository.GetLatestByUserIdAsync(userId);
        if (latestLog is not null && latestLog.Type == OccupancyLogType.CheckIn)
        {
            throw new ValidationException("You are already checked in at another library. Please check out first.");
        }

        if (library.CurrentOccupancy >= library.Capacity)
        {
            throw new ValidationException("Library is currently full");
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
        var library = await _libraryRepository.GetByIdAsync(libraryId).GetOrThrowAsync("kütüphane", libraryId);
        await _userRepository.GetByIdAsync(userId).GetOrThrowAsync("user", userId);

        EnsureQrTokenMatches(library, qrToken);

        var latestLog = await _occupancyLogRepository.GetLatestByUserIdAsync(userId);
        if (latestLog is null || latestLog.Type != OccupancyLogType.CheckIn)
        {
            throw new ValidationException("You are not checked in anywhere.");
        }

        if (latestLog.LibraryId != libraryId)
        {
            throw new ValidationException("You are checked in at a different library. Please check out from there first.");
        }

        if (library.CurrentOccupancy <= 0)
        {
            throw new ValidationException("Occupancy is already zero");
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

        return new MyCheckInStatusDto
        {
            LibraryId = latestLog.LibraryId,
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
        if (library.QrCodeToken != qrToken)
        {
            throw new ValidationException("Invalid QR code for this library.");
        }
    }

    private static OccupancyLog CreateLog(Guid libraryId, Guid userId, OccupancyLogType type)
    {
        return new OccupancyLog
        {
            Id = Guid.NewGuid(),
            LibraryId = libraryId,
            UserId = userId,
            Type = type,
            Timestamp = DateTime.UtcNow
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
