namespace LibraryOccupancy.Api.Models;

public class RefreshToken
{
    public Guid Id { get; set; }

    // SHA-256 hash of the raw token (see RefreshTokenHasher) — the raw value is only ever
    // returned to the client, never persisted, mirroring how PasswordHash never stores a
    // plaintext password.
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
