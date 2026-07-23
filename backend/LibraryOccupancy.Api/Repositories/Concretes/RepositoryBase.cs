namespace LibraryOccupancy.Api.Repositories.Concretes;

public class RepositoryBase<TEntity> : IRepository<TEntity> where TEntity : class
{
    protected readonly DbSet<TEntity> _dbSet;

    public RepositoryBase(ApplicationDbContext context)
    {
        _dbSet = context.Set<TEntity>();
    }

    public async Task<List<TEntity>> GetAllAsync()
    {
        return await _dbSet.AsNoTracking().ToListAsync();
    }

    // Tracked olarak dönüyor (AsNoTracking yok) çünkü Update/Delete akışları aynı DbContext
    // içinde bu entity'yi mutasyona uğratıp SaveChanges bekliyor. Salt-okuma senaryolarında
    // (örn. GetById endpoint'i) bu, gereksiz bir tracking maliyeti getirir; ölçek büyürse
    // ayrı bir no-tracking varyantı eklenebilir.
    public async Task<TEntity?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public void Add(TEntity entity)
    {
        _dbSet.Add(entity);
    }

    public void Update(TEntity entity)
    {
        _dbSet.Update(entity);
    }

    public void Delete(TEntity entity)
    {
        _dbSet.Remove(entity);
    }
}
