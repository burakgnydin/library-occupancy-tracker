using System.ComponentModel.DataAnnotations;

namespace LibraryOccupancy.Api.DTOs.Auth;

public class LoginDto
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
