using Microsoft.AspNetCore.Authorization;

namespace LibraryOccupancy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LibrariesController : ControllerBase
{
    private readonly ILibraryService _libraryService;
    private readonly IOccupancyService _occupancyService;

    public LibrariesController(ILibraryService libraryService, IOccupancyService occupancyService)
    {
        _libraryService = libraryService;
        _occupancyService = occupancyService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<LibraryDto>>> GetAll([FromQuery] LibraryQueryParameters queryParameters)
    {
        var libraries = await _libraryService.GetAllAsync(queryParameters);
        return Ok(libraries);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LibraryDto>> GetById(Guid id)
    {
        var library = await _libraryService.GetByIdAsync(id);
        return Ok(library);
    }

    [Authorize(Policy = PolicyNames.StaffOrAbove)]
    [HttpPost]
    public async Task<ActionResult<LibraryDto>> Create(CreateLibraryDto dto)
    {
        var library = await _libraryService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = library.Id }, library);
    }

    [Authorize(Policy = PolicyNames.StaffOrAbove)]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LibraryDto>> Update(Guid id, UpdateLibraryDto dto)
    {
        var library = await _libraryService.UpdateAsync(id, dto);
        return Ok(library);
    }

    [Authorize(Policy = PolicyNames.StaffOrAbove)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _libraryService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("{id:guid}/qrcode")]
    public async Task<IActionResult> GetQrCode(Guid id)
    {
        var qrCodeBytes = await _libraryService.GenerateQrCodeAsync(id);
        return File(qrCodeBytes, "image/png");
    }

    // Literal segment "checkin-status" never collides with the {id:guid} route above -
    // ASP.NET Core's endpoint routing resolves literal segments before falling back to
    // constrained parameters, and "checkin-status" fails the guid constraint anyway.
    [Authorize]
    [HttpGet("checkin-status")]
    public async Task<ActionResult<MyCheckInStatusDto>> GetMyCheckInStatus()
    {
        var status = await _occupancyService.GetMyStatusAsync(this.GetCurrentUserId());
        return Ok(status);
    }

    [Authorize]
    [HttpPost("{id:guid}/checkin")]
    public async Task<ActionResult<CheckInOutResultDto>> CheckIn(Guid id, [FromBody] CheckInRequestDto dto)
    {
        var result = await _occupancyService.CheckInAsync(id, this.GetCurrentUserId(), dto.QrToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("{id:guid}/checkout")]
    public async Task<ActionResult<CheckInOutResultDto>> CheckOut(Guid id, [FromBody] CheckOutRequestDto dto)
    {
        var result = await _occupancyService.CheckOutAsync(id, this.GetCurrentUserId(), dto.QrToken);
        return Ok(result);
    }
}
