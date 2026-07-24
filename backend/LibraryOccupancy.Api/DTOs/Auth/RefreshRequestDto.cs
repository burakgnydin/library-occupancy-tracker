using System.ComponentModel.DataAnnotations;

namespace LibraryOccupancy.Api.DTOs.Auth;

public class RefreshRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
