namespace LibraryOccupancy.Api.Repositories.Concretes;

public class RepositoryBase<TEntity> : IRepository<TEntity> where TEntity : class
{
    private readonly DbSet<TEntity> _dbSet;

    // Exposes only the DbSet itself to derived repositories (not the private field), keeping
    // CA1051 happy without hiding query capability they legitimately need for their own
    // entity-specific queries (GetPagedAsync, ExistsByNameAndAddressAsync, etc.).
    protected DbSet<TEntity> Set => _dbSet;

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
    // (örn. GetById endpoint'i) GetByIdNoTrackingAsync kullanılmalı.
    public async Task<TEntity?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<TEntity?> GetByIdNoTrackingAsync(Guid id)
    {
        return await _dbSet.AsNoTracking().FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id);
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _dbSet.AnyAsync(e => EF.Property<Guid>(e, "Id") == id);
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
