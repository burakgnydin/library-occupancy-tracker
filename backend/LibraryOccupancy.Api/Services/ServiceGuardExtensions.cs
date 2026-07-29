namespace LibraryOccupancy.Api.Services;

public static class ServiceGuardExtensions
{
    // entityName sadece log/Exception.Message icin (Ingilizce, orn. "library"/"user") -
    // kullaniciya donen mesaj errorCode uzerinden ErrorMessages.Resolve() ile bulunur.
    public static async Task<TEntity> GetOrThrowAsync<TEntity>(this Task<TEntity?> task, string entityName, Guid id, string errorCode)
    {
        var entity = await task;
        return entity ?? throw new NotFoundException($"{entityName} with id '{id}' was not found.", errorCode);
    }
}
