using System.ComponentModel.DataAnnotations;

namespace LibraryOccupancy.Api.DTOs.Common;

public class CheckInRequestDto
{
    [Required]
    public string QrToken { get; set; } = string.Empty;
}
