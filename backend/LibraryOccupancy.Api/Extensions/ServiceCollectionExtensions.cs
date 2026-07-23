using LibraryOccupancy.Api.Repositories.Concretes;
using LibraryOccupancy.Api.Services.Concretes;
using Serilog;

namespace LibraryOccupancy.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static WebApplicationBuilder ConfigureSerilog(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, services, configuration) => configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console()
            .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day));

        return builder;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddOpenApi();
        services.AddAutoMapper(cfg => { }, typeof(Program).Assembly);

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ILibraryRepository, LibraryRepository>();
        services.AddScoped<ILibraryService, LibraryService>();
        services.AddScoped<IOccupancyLogRepository, OccupancyLogRepository>();
        services.AddScoped<IOccupancyService, OccupancyService>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}
