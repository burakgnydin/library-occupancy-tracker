namespace LibraryOccupancy.Api.Repositories.Abstracts;

public interface ILibraryRepository : IRepository<Library>
{
    Task<(List<Library> Items, int TotalCount)> GetPagedAsync(LibraryQueryParameters parameters);
    Task<bool> ExistsByNameAndAddressAsync(string name, string address, Guid? excludeId = null);
}
