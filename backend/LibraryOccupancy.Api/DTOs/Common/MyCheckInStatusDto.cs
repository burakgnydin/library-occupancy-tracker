namespace LibraryOccupancy.Api.DTOs.Common;

public class MyCheckInStatusDto
{
    public Guid? LibraryId { get; set; }
    public DateTime? CheckedInAt { get; set; }
}
