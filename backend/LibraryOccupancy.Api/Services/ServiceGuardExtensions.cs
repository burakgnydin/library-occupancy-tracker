namespace LibraryOccupancy.Api.Services;

public static class ServiceGuardExtensions
{
    public static async Task<TEntity> GetOrThrowAsync<TEntity>(this Task<TEntity?> task, string entityName, Guid id)
    {
        var entity = await task;
        return entity ?? throw new NotFoundException($"'{id}' Id'sine sahip {entityName} bulunamadı.");
    }
}
