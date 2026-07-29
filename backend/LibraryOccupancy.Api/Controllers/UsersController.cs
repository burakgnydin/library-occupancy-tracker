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

    // Sadece SuperAdmin - tum kullanicilari (rol farketmeksizin) listeleyebilen
    // tek endpoint. Diger [Authorize] endpoint'lerin aksine burada
    // CanAccessAnyUserAsync/StaffOrAbove degil, bilerek daha dar olan
    // SuperAdminOnly policy'si kullaniliyor (bkz. gorev talimati - Admin'ler
    // kendi olusturamadiklari/yonetemedikleri kullanicilarin tam listesini
    // gormemeli).
    [Authorize(Policy = PolicyNames.SuperAdminOnly)]
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<UserDto>>> GetAll([FromQuery] UserQueryParameters queryParameters)
    {
        var users = await _userService.GetPagedAsync(queryParameters);
        return Ok(users);
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

    // Sadece SuperAdmin - Update (yukarida) kendi profilini duzenleyen herkese
    // acikken, rol degistirme cok daha ayricalikli bir islem oldugu icin ayri
    // ve dar bir policy arkasinda. Kendi rolunu degistirme korumasi
    // (UserService.UpdateRoleAsync) zaten burada requestingUserId ile ayrica
    // kontrol ediliyor.
    [Authorize(Policy = PolicyNames.SuperAdminOnly)]
    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult<UserDto>> UpdateRole(Guid id, UpdateUserRoleDto dto)
    {
        var user = await _userService.UpdateRoleAsync(id, dto.Role, CurrentUserId);
        return Ok(user);
    }

    // Mevcut "self or staff" DELETE'i SuperAdminOnly'e daraltmiyoruz (bu, hem
    // normal kullanicilarin kendi hesaplarini silebilmesini hem de Admin'lerin
    // yonettigi kullanicilari silebilmesini kirar) - "SuperAdmin kendi hesabini
    // silemez" korumasi bunun yerine UserService.DeleteAsync icinde, sadece
    // isAdmin=true (StaffOrAbove) yolundan gecen cagrilar icin dar bir sekilde
    // ekleniyor (bkz. o metottaki yorum).
    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _userService.DeleteAsync(id, CurrentUserId, await CanAccessAnyUserAsync());
        return NoContent();
    }
}
