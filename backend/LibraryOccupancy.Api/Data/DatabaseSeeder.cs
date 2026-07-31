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

    // Runs in Development unconditionally (so a fresh clone/container always has something to
    // look at), or elsewhere only when DemoSeeding:Enabled is explicitly set - e.g. a Render
    // demo deployment on an ephemeral disk that needs sample data recreated on every restart.
    // Flip DemoSeeding:Enabled to false once this stops being a demo and starts holding real
    // library data.
    public static async Task SeedDemoLibrariesAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var demoSeedingSettings = scope.ServiceProvider.GetRequiredService<IOptions<DemoSeedingSettings>>().Value;
        if (!app.Environment.IsDevelopment() && !demoSeedingSettings.Enabled)
        {
            return;
        }

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var librariesExist = await dbContext.Libraries.AnyAsync();
        if (librariesExist)
        {
            return;
        }

        // Fixed, representative occupancy values (not randomized) so the demo is reproducible
        // across restarts and deliberately spans the full Low/Medium/High range - including one
        // library at 0% - rather than every seeded row looking the same.
        var demoLibraries = new List<Library>
        {
            new()
            {
                Name = "Trabzon Merkez Kütüphanesi",
                Address = "Kahramanmaraş Cad. No:12, Ortahisar",
                City = "Trabzon",
                District = "Ortahisar",
                Capacity = 200,
                CurrentOccupancy = 0,
                QrCodeToken = Guid.NewGuid().ToString()
            },
            new()
            {
                Name = "Ortahisar Halk Kütüphanesi",
                Address = "Kunduracılar Sk. No:5, Ortahisar",
                City = "Trabzon",
                District = "Ortahisar",
                Capacity = 120,
                CurrentOccupancy = 40,
                QrCodeToken = Guid.NewGuid().ToString()
            },
            new()
            {
                Name = "Akçaabat İlçe Kütüphanesi",
                Address = "Fatih Cad. No:34, Akçaabat",
                City = "Trabzon",
                District = "Akçaabat",
                Capacity = 80,
                CurrentOccupancy = 68,
                QrCodeToken = Guid.NewGuid().ToString()
            },
            new()
            {
                Name = "Yomra Gençlik Kütüphanesi",
                Address = "Sahil Yolu Cad. No:8, Yomra",
                City = "Trabzon",
                District = "Yomra",
                Capacity = 60,
                CurrentOccupancy = 39,
                QrCodeToken = Guid.NewGuid().ToString()
            },
            new()
            {
                Name = "Değirmendere Kütüphanesi",
                Address = "Atatürk Cad. No:21, Değirmendere",
                City = "Trabzon",
                District = "Ortahisar",
                Capacity = 150,
                CurrentOccupancy = 90,
                QrCodeToken = Guid.NewGuid().ToString()
            },
            new()
            {
                Name = "Vakfıkebir Halk Kütüphanesi",
                Address = "Cumhuriyet Meydanı No:3, Vakfıkebir",
                City = "Trabzon",
                District = "Vakfıkebir",
                Capacity = 90,
                CurrentOccupancy = 85,
                QrCodeToken = Guid.NewGuid().ToString()
            }
        };

        dbContext.Libraries.AddRange(demoLibraries);
        await dbContext.SaveChangesAsync();

        app.Logger.LogInformation("Seeded {Count} demo libraries.", demoLibraries.Count);
    }
}
