namespace LibraryOccupancy.Api.Repositories.Concretes;

public class LibraryRepository : RepositoryBase<Library>, ILibraryRepository
{
    public LibraryRepository(ApplicationDbContext context) : base(context)
    {
    }
}
