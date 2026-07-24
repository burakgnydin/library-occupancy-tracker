using Microsoft.AspNetCore.Authorization;

namespace LibraryOccupancy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAuthorizationService _authorizationService;

    public UsersController(IUserService userService, IAuthorizationService authorizationService)
    {
        _userService = userService;
        _authorizationService = authorizationService;
    }

    private Guid CurrentUserId => this.GetCurrentUserId();

    // Goes through the same "StaffOrAbove" policy the [Authorize(Policy = ...)] attributes use
    // elsewhere, instead of re-deriving "Admin or SuperAdmin" with its own IsInRole checks — one
    // definition of "who counts as staff", so the two can't silently drift apart.
    private async Task<bool> CanAccessAnyUserAsync()
    {
        var result = await _authorizationService.AuthorizeAsync(User, PolicyNames.StaffOrAbove);
        return result.Succeeded;
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterUserDto dto)
    {
        var user = await _userService.RegisterAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [Authorize(Policy = PolicyNames.SuperAdminOnly)]
    [HttpPost("create-staff")]
    public async Task<ActionResult<UserDto>> CreateStaff(CreateStaffDto dto)
    {
        var user = await _userService.CreateStaffAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _userService.GetByIdAsync(id, CurrentUserId, await CanAccessAnyUserAsync());
        return Ok(user);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, UpdateUserDto dto)
    {
        var user = await _userService.UpdateAsync(id, dto, CurrentUserId, await CanAccessAnyUserAsync());
        return Ok(user);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _userService.DeleteAsync(id, CurrentUserId, await CanAccessAnyUserAsync());
        return NoContent();
    }
}
