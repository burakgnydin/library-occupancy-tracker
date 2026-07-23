namespace LibraryOccupancy.Api.Repositories.Concretes;

public class OccupancyLogRepository : RepositoryBase<OccupancyLog>, IOccupancyLogRepository
{
    public OccupancyLogRepository(ApplicationDbContext context) : base(context)
    {
    }
}
