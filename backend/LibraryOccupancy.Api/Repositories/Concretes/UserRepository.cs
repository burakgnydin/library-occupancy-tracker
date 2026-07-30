namespace LibraryOccupancy.Api.Repositories.Concretes;

public class UserRepository : RepositoryBase<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await Set.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<(List<User> Items, int TotalCount)> GetPagedAsync(UserQueryParameters parameters)
    {
        var query = Set.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(u =>
                EF.Functions.Like(u.FullName, $"%{parameters.Search}%") ||
                EF.Functions.Like(u.Email, $"%{parameters.Search}%"));
        }

        if (parameters.Role is not null)
        {
            query = query.Where(u => u.Role == parameters.Role);
        }

        query = query.OrderBy(u => u.FullName);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((parameters.PageNumber - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync();

        return (items, totalCount);
    }
}
