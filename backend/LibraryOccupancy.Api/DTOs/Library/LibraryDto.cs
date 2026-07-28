namespace LibraryOccupancy.Api.DTOs.Library;

public class LibraryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int CurrentOccupancy { get; set; }
    public int OccupancyPercentage { get; set; }
    public OccupancyStatus OccupancyStatus { get; set; }
}
