namespace LibraryOccupancy.Api.Repositories.Concretes;

public class OccupancyLogRepository : RepositoryBase<OccupancyLog>, IOccupancyLogRepository
{
    public OccupancyLogRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<OccupancyLog?> GetLatestByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Where(log => log.UserId == userId)
            .OrderByDescending(log => log.Timestamp)
            .FirstOrDefaultAsync();
    }
}
