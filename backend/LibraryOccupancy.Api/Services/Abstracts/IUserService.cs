namespace LibraryOccupancy.Api.Services.Abstracts;

public interface IUserService
{
    Task<UserDto> RegisterAsync(RegisterUserDto dto);
    Task<UserDto> CreateStaffAsync(CreateStaffDto dto);
    Task<UserDto> GetByIdAsync(Guid id, Guid requestingUserId, bool isAdmin);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto, Guid requestingUserId, bool isAdmin);
    Task DeleteAsync(Guid id, Guid requestingUserId, bool isAdmin);
}
