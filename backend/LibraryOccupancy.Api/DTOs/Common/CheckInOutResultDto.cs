namespace LibraryOccupancy.Api.DTOs.Common;

public class CheckInOutResultDto
{
    public Guid LibraryId { get; set; }
    public int CurrentOccupancy { get; set; }
    public int Capacity { get; set; }
    public int OccupancyPercentage { get; set; }
    public OccupancyStatus OccupancyStatus { get; set; }
    public OccupancyLogType Type { get; set; }
    public DateTime Timestamp { get; set; }
}
