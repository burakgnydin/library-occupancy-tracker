namespace LibraryOccupancy.Api.Services.Abstracts;

public interface IOccupancyService
{
    Task<CheckInOutResultDto> CheckInAsync(Guid libraryId, Guid userId, string qrToken);
    Task<CheckInOutResultDto> CheckOutAsync(Guid libraryId, Guid userId, string qrToken);
    Task<MyCheckInStatusDto> GetMyStatusAsync(Guid userId);
}
