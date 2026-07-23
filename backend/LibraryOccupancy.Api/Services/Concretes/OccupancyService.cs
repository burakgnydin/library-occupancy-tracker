namespace LibraryOccupancy.Api.Services.Concretes;

public class OccupancyService : IOccupancyService
{
    private readonly ILibraryRepository _libraryRepository;
    private readonly IUserRepository _userRepository;
    private readonly IOccupancyLogRepository _occupancyLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public OccupancyService(
        ILibraryRepository libraryRepository,
        IUserRepository userRepository,
        IOccupancyLogRepository occupancyLogRepository,
        IUnitOfWork unitOfWork)
    {
        _libraryRepository = libraryRepository;
        _userRepository = userRepository;
        _occupancyLogRepository = occupancyLogRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CheckInOutResultDto> CheckInAsync(Guid libraryId, Guid userId)
    {
        var library = await _libraryRepository.GetByIdAsync(libraryId).GetOrThrowAsync("kütüphane", libraryId);
        await _userRepository.GetByIdAsync(userId).GetOrThrowAsync("user", userId);

        if (library.CurrentOccupancy >= library.Capacity)
        {
            throw new ValidationException("Library is currently full");
        }

        library.CurrentOccupancy += 1;

        var log = CreateLog(libraryId, userId, OccupancyLogType.CheckIn);
        _occupancyLogRepository.Add(log);

        await _unitOfWork.SaveChangesAsync();

        return ToResultDto(library, log);
    }

    public async Task<CheckInOutResultDto> CheckOutAsync(Guid libraryId, Guid userId)
    {
        var library = await _libraryRepository.GetByIdAsync(libraryId).GetOrThrowAsync("kütüphane", libraryId);
        await _userRepository.GetByIdAsync(userId).GetOrThrowAsync("user", userId);

        if (library.CurrentOccupancy <= 0)
        {
            throw new ValidationException("Occupancy is already zero");
        }

        library.CurrentOccupancy -= 1;

        var log = CreateLog(libraryId, userId, OccupancyLogType.CheckOut);
        _occupancyLogRepository.Add(log);

        await _unitOfWork.SaveChangesAsync();

        return ToResultDto(library, log);
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
        return new CheckInOutResultDto
        {
            LibraryId = library.Id,
            CurrentOccupancy = library.CurrentOccupancy,
            Capacity = library.Capacity,
            Type = log.Type,
            Timestamp = log.Timestamp
        };
    }
}
