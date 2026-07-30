namespace LibraryOccupancy.Api.Repositories.Concretes;

public class LibraryRepository : RepositoryBase<Library>, ILibraryRepository
{
    public LibraryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(List<Library> Items, int TotalCount)> GetPagedAsync(LibraryQueryParameters parameters)
    {
        var query = Set.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(l => EF.Functions.Like(l.Name, $"%{parameters.Search}%"));
        }

        if (!string.IsNullOrWhiteSpace(parameters.City))
        {
            query = query.Where(l => EF.Functions.Like(l.City, $"%{parameters.City}%"));
        }

        if (!string.IsNullOrWhiteSpace(parameters.District))
        {
            query = query.Where(l => EF.Functions.Like(l.District, $"%{parameters.District}%"));
        }

        query = parameters.SortBy?.ToLowerInvariant() switch
        {
            "occupancy" => parameters.SortDescending
                ? query.OrderByDescending(l => l.CurrentOccupancy)
                : query.OrderBy(l => l.CurrentOccupancy),
            _ => parameters.SortDescending
                ? query.OrderByDescending(l => l.Name)
                : query.OrderBy(l => l.Name)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((parameters.PageNumber - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<bool> ExistsByNameAndAddressAsync(string name, string address, Guid? excludeId = null)
    {
        return await Set.AnyAsync(l =>
            l.Name == name && l.Address == address && (excludeId == null || l.Id != excludeId));
    }
}
