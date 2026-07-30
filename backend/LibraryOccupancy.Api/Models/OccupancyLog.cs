namespace LibraryOccupancy.Api.Models;

// Doesn't derive from BaseEntity: this table has no CreatedAt column, only Timestamp
// (the domain instant of the check-in/check-out event). Forcing BaseEntity here would add
// an unused CreatedAt column and require a migration for no real benefit. Id/Timestamp get
// the same auto-default-on-construction treatment via their own property initializers.
public class OccupancyLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LibraryId { get; set; }
    public Guid UserId { get; set; }
    public OccupancyLogType Type { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Library Library { get; set; } = null!;
    public User User { get; set; } = null!;
}
