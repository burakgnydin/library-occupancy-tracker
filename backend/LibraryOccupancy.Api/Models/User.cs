namespace LibraryOccupancy.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public ICollection<OccupancyLog> OccupancyLogs { get; set; } = new List<OccupancyLog>();
}
