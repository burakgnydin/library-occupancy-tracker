namespace LibraryOccupancy.Api.Services.Concretes;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UserService(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResultDto<UserDto>> GetPagedAsync(UserQueryParameters parameters)
    {
        var (items, totalCount) = await _userRepository.GetPagedAsync(parameters);

        return new PagedResultDto<UserDto>
        {
            Items = _mapper.Map<List<UserDto>>(items),
            TotalCount = totalCount,
            PageNumber = parameters.PageNumber,
            PageSize = parameters.PageSize
        };
    }

    public async Task<UserDto> RegisterAsync(RegisterUserDto dto)
    {
        var user = await CreateUserAsync(dto.FullName, dto.Email, dto.Password, UserRole.User);
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> CreateStaffAsync(CreateStaffDto dto)
    {
        if (dto.Role == UserRole.SuperAdmin)
        {
            throw new ValidationException("Cannot create a SuperAdmin user via this endpoint.", ErrorCodes.CannotCreateSuperAdmin);
        }

        var user = await CreateUserAsync(dto.FullName, dto.Email, dto.Password, dto.Role);
        return _mapper.Map<UserDto>(user);
    }

    private async Task<User> CreateUserAsync(string fullName, string email, string password, UserRole role)
    {
        var existingUser = await _userRepository.GetByEmailAsync(email);
        if (existingUser is not null)
        {
            throw new ConflictException("Email already registered", ErrorCodes.EmailAlreadyRegistered);
        }

        var user = new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role
        };

        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync();

        return user;
    }

    public async Task<UserDto> GetByIdAsync(Guid id, Guid requestingUserId, bool isAdmin)
    {
        EnsureSelfOrAdmin(id, requestingUserId, isAdmin);

        var user = await _userRepository.GetByIdNoTrackingAsync(id).GetOrThrowAsync("user", id, ErrorCodes.UserNotFound);
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto, Guid requestingUserId, bool isAdmin)
    {
        EnsureSelfOrAdmin(id, requestingUserId, isAdmin);

        var user = await _userRepository.GetByIdAsync(id).GetOrThrowAsync("user", id, ErrorCodes.UserNotFound);

        _mapper.Map(dto, user);

        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> UpdateRoleAsync(Guid targetUserId, UserRole newRole, Guid requestingUserId)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId).GetOrThrowAsync("user", targetUserId, ErrorCodes.UserNotFound);

        // SuperAdmin kendi rolunu degistiremez - aksi halde yanlislikla kendini
        // Admin/User'a dusurup panelden kendini kilitleyebilir (bkz. asagidaki
        // DeleteAsync'teki ayni felsefe - tek fark orada isAdmin genel personel
        // icin gecerliyken, bu endpoint zaten sadece SuperAdminOnly policy'si
        // arkasinda oldugu icin ek bir rol kontrolune gerek yok).
        if (targetUserId == requestingUserId)
        {
            throw new ForbiddenException("You cannot change your own role.", ErrorCodes.CannotChangeOwnRole);
        }

        user.Role = newRole;
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task DeleteAsync(Guid id, Guid requestingUserId, bool isAdmin)
    {
        EnsureSelfOrAdmin(id, requestingUserId, isAdmin);

        // Personel (Admin/SuperAdmin) kendi hesabini bu yoldan silemez -
        // ozellikle tek SuperAdmin hesabinin yanlislikla silinip sistemin
        // yoneticisiz kalmasini onlemek icin. Personel olmayan bir kullanicinin
        // kendi hesabini silmesi (self-service, isAdmin=false yolu) bu kuraldan
        // etkilenmiyor - sadece StaffOrAbove yetkisiyle gelen cagrilar icin
        // gecerli.
        if (isAdmin && id == requestingUserId)
        {
            throw new ForbiddenException("You cannot delete your own account.", ErrorCodes.CannotDeleteOwnAccount);
        }

        var user = await _userRepository.GetByIdAsync(id).GetOrThrowAsync("user", id, ErrorCodes.UserNotFound);

        _userRepository.Delete(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private static void EnsureSelfOrAdmin(Guid id, Guid requestingUserId, bool isAdmin)
    {
        if (!isAdmin && id != requestingUserId)
        {
            throw new ForbiddenException("You can only access your own profile.", ErrorCodes.ProfileAccessDenied);
        }
    }
}
