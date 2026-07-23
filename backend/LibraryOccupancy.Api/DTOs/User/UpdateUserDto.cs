using System.ComponentModel.DataAnnotations;

namespace LibraryOccupancy.Api.DTOs.User;

public class UpdateUserDto
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;
}
