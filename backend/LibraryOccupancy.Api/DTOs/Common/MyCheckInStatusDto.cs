namespace LibraryOccupancy.Api.DTOs.Common;

public class MyCheckInStatusDto
{
    public Guid? LibraryId { get; set; }
    public string? LibraryName { get; set; }
    public DateTime? CheckedInAt { get; set; }
}
