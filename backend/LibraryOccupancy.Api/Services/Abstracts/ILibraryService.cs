namespace LibraryOccupancy.Api.Services.Abstracts;

public interface ILibraryService
{
    Task<List<LibraryDto>> GetAllAsync();
    Task<LibraryDto> GetByIdAsync(Guid id);
    Task<LibraryDto> CreateAsync(CreateLibraryDto dto);
    Task<LibraryDto> UpdateAsync(Guid id, UpdateLibraryDto dto);
    Task DeleteAsync(Guid id);
    Task<byte[]> GenerateQrCodeAsync(Guid id);
}
