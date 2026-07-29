using System.ComponentModel.DataAnnotations;

namespace LibraryOccupancy.Api.DTOs.User;

public class UpdateUserRoleDto
{
    [Required]
    public UserRole Role { get; set; }
}
