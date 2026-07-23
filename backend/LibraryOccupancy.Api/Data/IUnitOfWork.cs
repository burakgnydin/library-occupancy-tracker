namespace LibraryOccupancy.Api.Data;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync();
}
