namespace LibraryOccupancy.Api.Models;

public class Library : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int CurrentOccupancy { get; set; }
    public string QrCodeToken { get; set; } = string.Empty;

    public ICollection<OccupancyLog> OccupancyLogs { get; set; } = new List<OccupancyLog>();
}
