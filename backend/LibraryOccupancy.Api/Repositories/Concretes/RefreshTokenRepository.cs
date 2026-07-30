namespace LibraryOccupancy.Api.Repositories.Concretes;

public class RefreshTokenRepository : RepositoryBase<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        var hashedToken = RefreshTokenHasher.Hash(token);
        return await Set.FirstOrDefaultAsync(r => r.Token == hashedToken);
    }

    public async Task<bool> TryRevokeAsync(Guid id)
    {
        var affectedRows = await Set
            .Where(r => r.Id == id && !r.IsRevoked)
            .ExecuteUpdateAsync(setters => setters.SetProperty(r => r.IsRevoked, true));

        return affectedRows > 0;
    }

    public async Task<int> DeleteExpiredOrRevokedAsync()
    {
        var now = DateTime.UtcNow;

        return await Set
            .Where(r => r.IsRevoked || r.ExpiresAt < now)
            .ExecuteDeleteAsync();
    }
}
