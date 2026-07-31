namespace LibraryOccupancy.Api.Data;

// Applies any pending EF Core migrations at startup instead of relying on `dotnet ef database
// update` having been run manually beforehand. This matters most for deployments with an
// ephemeral filesystem (e.g. Render's container disk is wiped on every deploy/restart) - without
// this, a fresh container boots with no database file and every request fails with "no such
// table" until someone runs migrations by hand.
public static class DatabaseMigrator
{
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await dbContext.Database.MigrateAsync();
    }
}
