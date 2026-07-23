namespace LibraryOccupancy.Api.Models;

public class OccupancyLog
{
    public Guid Id { get; set; }
    public Guid LibraryId { get; set; }
    public Guid UserId { get; set; }
    public OccupancyLogType Type { get; set; }
    public DateTime Timestamp { get; set; }

    public Library Library { get; set; } = null!;
    public User User { get; set; } = null!;
}
