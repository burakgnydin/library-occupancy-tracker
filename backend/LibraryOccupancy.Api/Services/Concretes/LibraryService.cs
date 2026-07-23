using QRCoder;

namespace LibraryOccupancy.Api.Services.Concretes;

public class LibraryService : ILibraryService
{
    private readonly ILibraryRepository _libraryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public LibraryService(ILibraryRepository libraryRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _libraryRepository = libraryRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<LibraryDto>> GetAllAsync()
    {
        var libraries = await _libraryRepository.GetAllAsync();
        return _mapper.Map<List<LibraryDto>>(libraries);
    }

    public async Task<LibraryDto> GetByIdAsync(Guid id)
    {
        var library = await _libraryRepository.GetByIdAsync(id).GetOrThrowAsync("kütüphane", id);
        return _mapper.Map<LibraryDto>(library);
    }

    public async Task<LibraryDto> CreateAsync(CreateLibraryDto dto)
    {
        var library = _mapper.Map<Library>(dto);
        library.Id = Guid.NewGuid();
        library.QrCodeToken = Guid.NewGuid().ToString();
        library.CurrentOccupancy = 0;
        library.CreatedAt = DateTime.UtcNow;

        _libraryRepository.Add(library);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<LibraryDto>(library);
    }

    public async Task<LibraryDto> UpdateAsync(Guid id, UpdateLibraryDto dto)
    {
        var library = await _libraryRepository.GetByIdAsync(id).GetOrThrowAsync("kütüphane", id);

        // GetByIdAsync zaten bu entity'yi aynı DbContext üzerinde tracked olarak döndürüyor,
        // bu yüzden Map(dto, library) property'leri yerinde değiştiriyor ve change tracker
        // farkı otomatik yakalıyor. Ayrıca _libraryRepository.Update(library) çağırmaya
        // gerek yok (tüm alanları gereksiz yere Modified işaretlerdi).
        _mapper.Map(dto, library);

        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<LibraryDto>(library);
    }

    public async Task DeleteAsync(Guid id)
    {
        var library = await _libraryRepository.GetByIdAsync(id).GetOrThrowAsync("kütüphane", id);

        _libraryRepository.Delete(library);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<byte[]> GenerateQrCodeAsync(Guid id)
    {
        var library = await _libraryRepository.GetByIdAsync(id).GetOrThrowAsync("kütüphane", id);

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(library.QrCodeToken, QRCodeGenerator.ECCLevel.Q);
        var pngQrCode = new PngByteQRCode(qrCodeData);

        return pngQrCode.GetGraphic(20);
    }
}
