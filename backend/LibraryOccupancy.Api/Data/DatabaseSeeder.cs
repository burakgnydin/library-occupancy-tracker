using Microsoft.Extensions.Options;

namespace LibraryOccupancy.Api.Data;

// Intentionally bypasses the Unit of Work pattern (no IUnitOfWork/IRepository<T> — writes
// straight through ApplicationDbContext.Add + SaveChangesAsync). Seeding runs once at
// application startup, outside the normal controller → service → repository request
// pipeline that the UoW pattern exists to coordinate, so this deviation is acceptable here
// and shouldn't be copied into request-handling code.
public static class DatabaseSeeder
{
    public static async Task SeedInitialAdminAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var superAdminExists = await dbContext.Users.AnyAsync(u => u.Role == UserRole.SuperAdmin);
        if (superAdminExists)
        {
            return;
        }

        var settings = scope.ServiceProvider.GetRequiredService<IOptions<InitialAdminSettings>>().Value;
        if (string.IsNullOrWhiteSpace(settings.Email) || string.IsNullOrWhiteSpace(settings.Password))
        {
            app.Logger.LogWarning("InitialAdmin settings are not configured; skipping SuperAdmin bootstrap.");
            return;
        }

        dbContext.Users.Add(new User
        {
            FullName = settings.FullName,
            Email = settings.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(settings.Password),
            Role = UserRole.SuperAdmin
        });

        await dbContext.SaveChangesAsync();

        app.Logger.LogInformation("Bootstrapped initial SuperAdmin user with email {Email}.", settings.Email);
    }
}
