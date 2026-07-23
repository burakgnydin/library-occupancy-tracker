namespace LibraryOccupancy.Api.Mapping;

public class LibraryProfile : Profile
{
    public LibraryProfile()
    {
        CreateMap<Library, LibraryDto>();
        CreateMap<CreateLibraryDto, Library>();
        CreateMap<UpdateLibraryDto, Library>();
    }
}
