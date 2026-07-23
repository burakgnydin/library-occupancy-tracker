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
    public async Task<ActionResult<List<LibraryDto>>> GetAll()
    {
        var libraries = await _libraryService.GetAllAsync();
        return Ok(libraries);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LibraryDto>> GetById(Guid id)
    {
        var library = await _libraryService.GetByIdAsync(id);
        return Ok(library);
    }

    [HttpPost]
    public async Task<ActionResult<LibraryDto>> Create(CreateLibraryDto dto)
    {
        var library = await _libraryService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = library.Id }, library);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LibraryDto>> Update(Guid id, UpdateLibraryDto dto)
    {
        var library = await _libraryService.UpdateAsync(id, dto);
        return Ok(library);
    }

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

    // TODO: userId şu an query parametresinden alınıyor çünkü henüz JWT auth yok.
    // User sistemi ve auth eklendiğinde bu parametre kaldırılıp giriş yapmış
    // kullanıcının kimliği token'dan otomatik okunacak.
    [HttpPost("{id:guid}/checkin")]
    public async Task<ActionResult<CheckInOutResultDto>> CheckIn(Guid id, [FromQuery] Guid userId)
    {
        var result = await _occupancyService.CheckInAsync(id, userId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/checkout")]
    public async Task<ActionResult<CheckInOutResultDto>> CheckOut(Guid id, [FromQuery] Guid userId)
    {
        var result = await _occupancyService.CheckOutAsync(id, userId);
        return Ok(result);
    }
}
