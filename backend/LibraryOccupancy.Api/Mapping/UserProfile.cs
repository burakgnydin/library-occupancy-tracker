namespace LibraryOccupancy.Api.Mapping;

public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<User, UserDto>();

        // Only FullName is user-editable via this DTO — everything else is deliberately left
        // untouched on the already-loaded tracked entity, explicitly ignored so
        // AssertConfigurationIsValid() treats that as intentional, not a missed field.
        CreateMap<UpdateUserDto, User>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Email, opt => opt.Ignore())
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Role, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.OccupancyLogs, opt => opt.Ignore())
            .ForMember(dest => dest.RefreshTokens, opt => opt.Ignore());
    }
}
