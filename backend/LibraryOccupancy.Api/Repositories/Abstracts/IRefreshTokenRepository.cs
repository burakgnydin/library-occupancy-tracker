namespace LibraryOccupancy.Api.Repositories.Abstracts;

public interface IRefreshTokenRepository : IRepository<RefreshToken>
{
    Task<RefreshToken?> GetByTokenAsync(string token);

    // Atomically flips IsRevoked false -> true and reports whether THIS call was the one that
    // did it. Two concurrent callers racing on the same still-valid token can't both succeed —
    // only one UPDATE actually matches "WHERE IsRevoked = 0", the other affects zero rows.
    Task<bool> TryRevokeAsync(Guid id);
}
