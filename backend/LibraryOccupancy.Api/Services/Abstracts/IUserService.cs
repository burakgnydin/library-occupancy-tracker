namespace LibraryOccupancy.Api.Services.Abstracts;

public interface IUserService
{
    Task<UserDto> RegisterAsync(RegisterUserDto dto);
    Task<UserDto> GetByIdAsync(Guid id);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto);
    Task DeleteAsync(Guid id);
}
