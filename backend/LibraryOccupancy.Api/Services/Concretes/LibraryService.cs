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

    public async Task<PagedResultDto<LibraryDto>> GetAllAsync(LibraryQueryParameters parameters)
    {
        var (items, totalCount) = await _libraryRepository.GetPagedAsync(parameters);

        return new PagedResultDto<LibraryDto>
        {
            Items = _mapper.Map<List<LibraryDto>>(items),
            TotalCount = totalCount,
            PageNumber = parameters.PageNumber,
            PageSize = parameters.PageSize
        };
    }

    public async Task<LibraryDto> GetByIdAsync(Guid id)
    {
        var library = await _libraryRepository.GetByIdAsync(id).GetOrThrowAsync("kütüphane", id);
        return _mapper.Map<LibraryDto>(library);
    }

    public async Task<LibraryDto> CreateAsync(CreateLibraryDto dto)
    {
        var alreadyExists = await _libraryRepository.ExistsByNameAndAddressAsync(dto.Name, dto.Address);
        if (alreadyExists)
        {
            throw new ConflictException("A library with this name and address already exists.");
        }

        var library = _mapper.Map<Library>(dto);
        library.Id = Guid.NewGuid();
        library.QrCodeToken = Guid.NewGuid().ToString();
        library.CurrentOccupancy = 0;
        library.CreatedAt = DateTime.UtcNow;

        _libraryRepository.Add(library);
        await SaveChangesGuardingUniquenessAsync();

        return _mapper.Map<LibraryDto>(library);
    }

    public async Task<LibraryDto> UpdateAsync(Guid id, UpdateLibraryDto dto)
    {
        var library = await _libraryRepository.GetByIdAsync(id).GetOrThrowAsync("kütüphane", id);

        var alreadyExists = await _libraryRepository.ExistsByNameAndAddressAsync(dto.Name, dto.Address, excludeId: id);
        if (alreadyExists)
        {
            throw new ConflictException("A library with this name and address already exists.");
        }

        // GetByIdAsync zaten bu entity'yi aynı DbContext üzerinde tracked olarak döndürüyor,
        // bu yüzden Map(dto, library) property'leri yerinde değiştiriyor ve change tracker
        // farkı otomatik yakalıyor. Ayrıca _libraryRepository.Update(library) çağırmaya
        // gerek yok (tüm alanları gereksiz yere Modified işaretlerdi).
        _mapper.Map(dto, library);

        await SaveChangesGuardingUniquenessAsync();

        return _mapper.Map<LibraryDto>(library);
    }

    // The app-level ExistsByNameAndAddressAsync check above is a fast, friendly-error fast path,
    // but it's inherently a check-then-insert race: two concurrent requests can both pass it before
    // either commits. The DB's unique index on (Name, Address) is the real guarantee — this turns a
    // constraint violation from that race into the same ConflictException instead of a raw 500.
    private async Task SaveChangesGuardingUniquenessAsync()
    {
        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new ConflictException("A library with this name and address already exists.");
        }
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
