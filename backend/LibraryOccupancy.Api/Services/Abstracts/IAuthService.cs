namespace LibraryOccupancy.Api.Services.Abstracts;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RefreshAsync(RefreshRequestDto dto);
    Task LogoutAsync(RefreshRequestDto dto);
}
