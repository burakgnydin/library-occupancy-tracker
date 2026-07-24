using Microsoft.AspNetCore.RateLimiting;

namespace LibraryOccupancy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [EnableRateLimiting(LibraryOccupancy.Api.Extensions.ServiceCollectionExtensions.LoginRateLimitPolicy)]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshRequestDto dto)
    {
        var result = await _authService.RefreshAsync(dto);
        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequestDto dto)
    {
        await _authService.LogoutAsync(dto);
        return NoContent();
    }
}
