using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using LibraryOccupancy.Api.Repositories.Concretes;
using LibraryOccupancy.Api.Services.Concretes;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Data.Sqlite;
using Microsoft.IdentityModel.Tokens;
using Serilog;

namespace LibraryOccupancy.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public const string LoginRateLimitPolicy = "login";
    public const string CheckInOutRateLimitPolicy = "checkinout";
    public const string CorsPolicyName = "AllowFrontend";

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

    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.AddControllers()
            .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
            .ConfigureApiBehaviorOptions(options =>
            {
                // Automatic [ApiController] model-state validation otherwise returns ASP.NET Core's
                // own ValidationProblemDetails shape ({"type":...,"errors":{...}}), a different
                // contract than every other error in this API (ExceptionHandlingMiddleware's
                // {"message":"..."}), with the raw English DataAnnotations message inside. Reformat
                // to the same {"message":"..."} shape AND translate via ValidationMessageFormatter
                // so clients only ever handle one shape and one language.
                options.InvalidModelStateResponseFactory = context =>
                {
                    var firstEntry = context.ModelState
                        .Where(kvp => kvp.Value is { Errors.Count: > 0 })
                        .Select(kvp => (Field: kvp.Key, Error: kvp.Value!.Errors[0].ErrorMessage))
                        .FirstOrDefault();

                    var message = firstEntry.Error is null
                        ? "Geçersiz istek."
                        : ValidationMessageFormatter.Format(firstEntry.Field, firstEntry.Error);

                    return new BadRequestObjectResult(new { message });
                };
            });
        services.AddOpenApi(options => options.AddDocumentTransformer<BearerSecuritySchemeTransformer>());
        services.AddAutoMapper(cfg => { }, typeof(Program).Assembly);

        // SignalR's JSON hub protocol has its own serializer options, separate from MVC's
        // AddJsonOptions above - without this, enums would go over the wire as numbers instead
        // of the strings ("occupancyStatus":"Low") every REST response uses.
        services.AddSignalR()
            .AddJsonProtocol(options => options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        // BuildSqliteConnectionString() burada, AddApplicationServices'in disinda DEGIL, TAM
        // OLARAK BIR KEZ cagrilip sonucu bir local degiskende yakalaniyor - AddDbContext'e
        // verilen lambda EF Core tarafindan her yeni ApplicationDbContext (yani her request/
        // scope) olusturuldugunda tekrar calistirilir; BuildSqliteConnectionString'i DOGRUDAN
        // o lambda'nin icinden cagirmak (onceki hali) fonksiyonun (ve icindeki Console.WriteLine
        // logunun) sessizce her istekte tekrar tekrar calismasina yol aciyordu.
        var sqliteConnectionString = BuildSqliteConnectionString(configuration, environment);
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(sqliteConnectionString));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ILibraryRepository, LibraryRepository>();
        services.AddScoped<ILibraryService, LibraryService>();
        services.AddScoped<IOccupancyLogRepository, OccupancyLogRepository>();
        services.AddScoped<IOccupancyService, OccupancyService>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IAuthService, AuthService>();

        services.Configure<InitialAdminSettings>(configuration.GetSection(InitialAdminSettings.SectionName));
        services.Configure<RefreshTokenCleanupSettings>(configuration.GetSection(RefreshTokenCleanupSettings.SectionName));
        services.AddHostedService<RefreshTokenCleanupBackgroundService>();

        services.AddJwtAuthentication(configuration);
        services.AddRateLimiting();
        services.AddFrontendCors(configuration, environment);

        return services;
    }

    // If a DTO field is added without a matching AutoMapper configuration, AutoMapper silently
    // leaves it at its default value at runtime instead of failing — the same "silent wrong
    // behavior instead of loud failure" class of bug this project has hit before (relative paths,
    // CHANGE_ME placeholders). AssertConfigurationIsValid() catches that immediately at startup,
    // in Development, rather than someone noticing a field is always empty in production.
    public static void ValidateAutoMapperConfiguration(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        using var scope = app.Services.CreateScope();
        var mapper = scope.ServiceProvider.GetRequiredService<IMapper>();
        mapper.ConfigurationProvider.AssertConfigurationIsValid();
    }

    // Reflects over every DTO property carrying a DataAnnotations validation attribute and warns
    // (Development only, non-fatal - unlike ValidateAutoMapperConfiguration above, a missing entry
    // here degrades a message, it doesn't produce a wrong value silently) if any aren't listed in
    // ValidationMessageFormatter.FieldDisplayNames. Keeps that dictionary honest as DTOs change,
    // without hand-maintaining a second list here of what to check.
    public static void ValidateFieldDisplayNamesConfiguration(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        var validatedDtoFieldNames = typeof(Program).Assembly.GetTypes()
            .Where(t => t.Namespace is not null && t.Namespace.StartsWith("LibraryOccupancy.Api.DTOs", StringComparison.Ordinal))
            .SelectMany(t => t.GetProperties())
            .Where(p => p.GetCustomAttributes(typeof(ValidationAttribute), inherit: true).Length > 0)
            .Select(p => p.Name);

        var missingFields = ValidationMessageFormatter.GetUnmappedFieldNames(validatedDtoFieldNames);

        if (missingFields.Count > 0)
        {
            app.Logger.LogWarning(
                "ValidationMessageFormatter.FieldDisplayNames is missing a Turkish display name for: {MissingFields}. " +
                "These fields will fall back to their raw (English) property name in validation error messages.",
                string.Join(", ", missingFields));
        }
    }

    // Brute-force guard for /api/auth/login: 5 attempts per minute per client IP, no queueing
    // (a 6th attempt within the window is rejected immediately with 429, not delayed).
    //
    // Check-in/check-out get their own, more permissive policy partitioned by user id rather
    // than IP - these endpoints require auth, and multiple users can legitimately share an IP
    // (NAT/campus wifi), which would otherwise let one user exhaust the whole IP's budget.
    private static IServiceCollection AddRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(LoginRateLimitPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));

            options.AddPolicy(CheckInOutRateLimitPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 15,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
        });

        return services;
    }

    // Development: Expo/Metro picks a different port on every run (web preview, tunnel, LAN -
    // 8081, 8082, 8099, ...), so instead of enumerating ports we allow any localhost/127.0.0.1
    // origin via SetIsOriginAllowed. Production: only explicitly configured origins are allowed
    // (Cors:AllowedOrigins in appsettings.json) - the permissive localhost predicate never runs
    // outside Development. An empty/unconfigured origin list in production simply means no
    // browser-based frontend is allowed yet - it fails closed, not open.
    //
    // AllowCredentials() is required for SignalR: its default browser client sends credentials
    // on the negotiate/websocket handshake, and CORS rejects credentialed cross-origin requests
    // unless the policy both allows credentials and pins to specific origins - AllowAnyOrigin()
    // combined with AllowCredentials() is invalid and throws at runtime, which is why both
    // branches below use an origin allowlist (SetIsOriginAllowed / WithOrigins) rather than
    // AllowAnyOrigin.
    private static IServiceCollection AddFrontendCors(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, policy =>
            {
                if (environment.IsDevelopment())
                {
                    policy.SetIsOriginAllowed(origin =>
                            Uri.TryCreate(origin, UriKind.Absolute, out var originUri) &&
                            (originUri.Host == "localhost" || originUri.Host == "127.0.0.1"))
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
                else
                {
                    var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
            });
        });

        return services;
    }

    // "CHANGE_ME" placeholders in appsettings.json look like structurally valid values (a non-empty
    // string, a long-enough key) so nothing stops the app from starting and silently running with
    // them if appsettings.Development.json is missing or ASPNETCORE_ENVIRONMENT isn't 'Development'.
    // RequireConfigured turns that into a loud, actionable startup failure instead of a silent one —
    // reused for every critical setting below (connection string, JWT key/issuer/audience), and meant
    // to be reused for any future required setting too.
    private const string PlaceholderSentinel = "CHANGE_ME";

    private static void RequireConfigured(string settingPath, [NotNull] string? value, int minLength = 1)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"{settingPath} is not configured. Set a real value in appsettings.Development.json " +
                "(gitignored) or the current environment's configuration.");
        }

        if (value.Contains(PlaceholderSentinel, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"{settingPath} is still set to a '{PlaceholderSentinel}' placeholder from appsettings.json. " +
                "This usually means appsettings.Development.json is missing or ASPNETCORE_ENVIRONMENT isn't " +
                "'Development'. Refusing to start rather than silently running with an invalid/insecure value.");
        }

        if (value.Length < minLength)
        {
            throw new InvalidOperationException(
                $"{settingPath} must be at least {minLength} characters long (got {value.Length}).");
        }
    }

    // A relative SQLite "Data Source" resolves against the process's current working directory,
    // not the appsettings folder. Launching the app a different way (e.g. running the built .dll
    // directly instead of `dotnet run` from the project root) silently connects to a separate,
    // empty database file. Anchoring to ContentRootPath makes this independent of launch method.
    private static string BuildSqliteConnectionString(IConfiguration configuration, IHostEnvironment environment)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        RequireConfigured("ConnectionStrings:DefaultConnection", connectionString);

        var builder = new SqliteConnectionStringBuilder(connectionString);
        RequireConfigured("ConnectionStrings:DefaultConnection", builder.DataSource);

        if (!Path.IsPathRooted(builder.DataSource))
        {
            builder.DataSource = Path.Combine(environment.ContentRootPath, builder.DataSource);
        }

        Console.WriteLine($"Using SQLite database at: {builder.DataSource}");

        return builder.ConnectionString;
    }

    private static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
            ?? throw new InvalidOperationException("Jwt settings are not configured.");

        RequireConfigured("Jwt:Key", jwtSettings.Key, minLength: 32);
        RequireConfigured("Jwt:Issuer", jwtSettings.Issuer);
        RequireConfigured("Jwt:Audience", jwtSettings.Audience);

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

        // Single source of truth for "which roles count as X" — used by both declarative
        // [Authorize(Policy = ...)] attributes and imperative IAuthorizationService checks
        // (e.g. UsersController's "self or staff" logic), so the two never drift apart.
        services.AddAuthorization(options =>
        {
            options.AddPolicy(PolicyNames.StaffOrAbove, policy => policy.RequireRole(Roles.SuperAdmin, Roles.Admin));
            options.AddPolicy(PolicyNames.SuperAdminOnly, policy => policy.RequireRole(Roles.SuperAdmin));
        });

        return services;
    }
}
