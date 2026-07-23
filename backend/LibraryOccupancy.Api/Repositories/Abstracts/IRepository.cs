namespace LibraryOccupancy.Api.Repositories.Abstracts;

public interface IRepository<TEntity> where TEntity : class
{
    Task<List<TEntity>> GetAllAsync();
    Task<TEntity?> GetByIdAsync(Guid id);
    void Add(TEntity entity);
    void Update(TEntity entity);
    void Delete(TEntity entity);
}
