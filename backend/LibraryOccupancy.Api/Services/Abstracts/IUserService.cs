namespace LibraryOccupancy.Api.Services.Abstracts;

public interface IUserService
{
    Task<PagedResultDto<UserDto>> GetPagedAsync(UserQueryParameters parameters);
    Task<UserDto> RegisterAsync(RegisterUserDto dto);
    Task<UserDto> CreateStaffAsync(CreateStaffDto dto);
    Task<UserDto> GetByIdAsync(Guid id, Guid requestingUserId, bool isAdmin);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto, Guid requestingUserId, bool isAdmin);
    Task<UserDto> UpdateRoleAsync(Guid targetUserId, UserRole newRole, Guid requestingUserId);
    Task DeleteAsync(Guid id, Guid requestingUserId, bool isAdmin);
}
