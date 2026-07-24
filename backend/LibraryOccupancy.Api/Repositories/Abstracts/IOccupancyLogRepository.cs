namespace LibraryOccupancy.Api.Repositories.Abstracts;

public interface IOccupancyLogRepository : IRepository<OccupancyLog>
{
    Task<OccupancyLog?> GetLatestByUserIdAsync(Guid userId);
}
