using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LibraryOccupancy.Api.Services.Concretes;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IUnitOfWork unitOfWork,
        IOptions<JwtSettings> jwtSettings)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _unitOfWork = unitOfWork;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.", ErrorCodes.InvalidCredentials);
        }

        var (accessToken, expiresAt) = GenerateAccessToken(user);
        var (_, rawRefreshToken) = CreateRefreshToken(user.Id);

        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresAt = expiresAt,
            Role = user.Role.ToString()
        };
    }

    public async Task<AuthResponseDto> RefreshAsync(RefreshRequestDto dto)
    {
        var existingToken = await _refreshTokenRepository.GetByTokenAsync(dto.RefreshToken);
        if (existingToken is null || existingToken.IsRevoked || existingToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.", ErrorCodes.InvalidRefreshToken);
        }

        // Atomically claim the token (UPDATE ... WHERE IsRevoked = 0) instead of load-then-save.
        // Two concurrent refresh requests for the same token both pass the check above before
        // either commits; only one of them can win this conditional update, so only one gets to
        // mint a new token pair — the other is treated as reusing an already-consumed token.
        var claimed = await _refreshTokenRepository.TryRevokeAsync(existingToken.Id);
        if (!claimed)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.", ErrorCodes.InvalidRefreshToken);
        }

        var user = await _userRepository.GetByIdAsync(existingToken.UserId)
            ?? throw new UnauthorizedException("Invalid or expired refresh token.", ErrorCodes.InvalidRefreshToken);

        var (accessToken, expiresAt) = GenerateAccessToken(user);
        var (_, rawNewRefreshToken) = CreateRefreshToken(user.Id);

        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = rawNewRefreshToken,
            ExpiresAt = expiresAt,
            Role = user.Role.ToString()
        };
    }

    public async Task LogoutAsync(RefreshRequestDto dto)
    {
        var existingToken = await _refreshTokenRepository.GetByTokenAsync(dto.RefreshToken);
        if (existingToken is null || existingToken.IsRevoked)
        {
            return;
        }

        existingToken.IsRevoked = true;
        await _unitOfWork.SaveChangesAsync();
    }

    private (RefreshToken Entity, string RawToken) CreateRefreshToken(Guid userId)
    {
        var rawToken = GenerateSecureToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = RefreshTokenHasher.Hash(rawToken),
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        _refreshTokenRepository.Add(refreshToken);
        return (refreshToken, rawToken);
    }

    private (string AccessToken, DateTime ExpiresAt) GenerateAccessToken(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private static string GenerateSecureToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
}
