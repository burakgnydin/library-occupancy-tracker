namespace LibraryOccupancy.Api.Services.Abstracts;

public interface IOccupancyService
{
    Task<CheckInOutResultDto> CheckInAsync(Guid libraryId, Guid userId);
    Task<CheckInOutResultDto> CheckOutAsync(Guid libraryId, Guid userId);
}
