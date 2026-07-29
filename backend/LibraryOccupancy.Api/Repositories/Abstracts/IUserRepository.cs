namespace LibraryOccupancy.Api.Repositories.Abstracts;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<(List<User> Items, int TotalCount)> GetPagedAsync(UserQueryParameters parameters);
}
