namespace LibraryOccupancy.Api.Repositories.Abstracts;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
}
