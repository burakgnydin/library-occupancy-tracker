using System.ComponentModel.DataAnnotations;

namespace LibraryOccupancy.Api.DTOs.User;

public class RegisterUserDto
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    [MaxLength(72)]
    public string Password { get; set; } = string.Empty;
}
