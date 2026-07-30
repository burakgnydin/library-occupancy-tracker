namespace LibraryOccupancy.Api.Repositories.Abstracts;

public interface IRepository<TEntity> where TEntity : class
{
    Task<List<TEntity>> GetAllAsync();
    Task<TEntity?> GetByIdAsync(Guid id);

    // Read-only lookup (AsNoTracking) for callers that only need to project/return the entity
    // and won't Update/Delete it in the same DbContext — skips change-tracker bookkeeping that
    // GetByIdAsync's tracked result requires for in-place mutation.
    Task<TEntity?> GetByIdNoTrackingAsync(Guid id);

    // Lighter than GetByIdNoTrackingAsync for callers that only need a yes/no answer (e.g. a
    // SignalR hub validating a group name before subscribing a connection to it) — translates
    // to a SQL EXISTS/COUNT, never materializes the entity.
    Task<bool> ExistsAsync(Guid id);
    void Add(TEntity entity);
    void Update(TEntity entity);
    void Delete(TEntity entity);
}
