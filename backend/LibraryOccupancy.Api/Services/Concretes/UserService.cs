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

    public async Task<UserDto> RegisterAsync(RegisterUserDto dto)
    {
        var user = await CreateUserAsync(dto.FullName, dto.Email, dto.Password, UserRole.User);
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> CreateStaffAsync(CreateStaffDto dto)
    {
        if (dto.Role == UserRole.SuperAdmin)
        {
            throw new ValidationException("Cannot create a SuperAdmin user via this endpoint.");
        }

        var user = await CreateUserAsync(dto.FullName, dto.Email, dto.Password, dto.Role);
        return _mapper.Map<UserDto>(user);
    }

    private async Task<User> CreateUserAsync(string fullName, string email, string password, UserRole role)
    {
        var existingUser = await _userRepository.GetByEmailAsync(email);
        if (existingUser is not null)
        {
            throw new ConflictException("Email already registered");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync();

        return user;
    }

    public async Task<UserDto> GetByIdAsync(Guid id, Guid requestingUserId, bool isAdmin)
    {
        EnsureSelfOrAdmin(id, requestingUserId, isAdmin);

        var user = await _userRepository.GetByIdAsync(id).GetOrThrowAsync("kullanıcı", id);
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto, Guid requestingUserId, bool isAdmin)
    {
        EnsureSelfOrAdmin(id, requestingUserId, isAdmin);

        var user = await _userRepository.GetByIdAsync(id).GetOrThrowAsync("kullanıcı", id);

        _mapper.Map(dto, user);

        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task DeleteAsync(Guid id, Guid requestingUserId, bool isAdmin)
    {
        EnsureSelfOrAdmin(id, requestingUserId, isAdmin);

        var user = await _userRepository.GetByIdAsync(id).GetOrThrowAsync("kullanıcı", id);

        _userRepository.Delete(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private static void EnsureSelfOrAdmin(Guid id, Guid requestingUserId, bool isAdmin)
    {
        if (!isAdmin && id != requestingUserId)
        {
            throw new ForbiddenException("You can only access your own profile.");
        }
    }
}
