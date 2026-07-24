namespace LibraryOccupancy.Api.Mapping;

public class LibraryProfile : Profile
{
    public LibraryProfile()
    {
        CreateMap<Library, LibraryDto>()
            .ForMember(dest => dest.OccupancyPercentage, opt => opt.MapFrom(src => OccupancyCalculator.CalculatePercentage(src.CurrentOccupancy, src.Capacity)))
            .ForMember(dest => dest.OccupancyStatus, opt => opt.MapFrom(src => OccupancyCalculator.CalculateStatus(OccupancyCalculator.CalculatePercentage(src.CurrentOccupancy, src.Capacity))));

        // Id/QrCodeToken/CurrentOccupancy/CreatedAt are set by LibraryService after mapping (Create),
        // or deliberately left untouched on the already-loaded tracked entity (Update) — explicitly
        // ignored here so AssertConfigurationIsValid() treats that as intentional, not a missed field.
        CreateMap<CreateLibraryDto, Library>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentOccupancy, opt => opt.Ignore())
            .ForMember(dest => dest.QrCodeToken, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.OccupancyLogs, opt => opt.Ignore());

        CreateMap<UpdateLibraryDto, Library>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentOccupancy, opt => opt.Ignore())
            .ForMember(dest => dest.QrCodeToken, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.OccupancyLogs, opt => opt.Ignore());
    }
}
