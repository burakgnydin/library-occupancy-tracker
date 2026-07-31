using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LibraryOccupancy.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Library> Libraries => Set<Library>();
    public DbSet<User> Users => Set<User>();
    public DbSet<OccupancyLog> OccupancyLogs => Set<OccupancyLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Library>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.HasIndex(l => l.QrCodeToken).IsUnique();
            entity.HasIndex(l => new { l.Name, l.Address }).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<OccupancyLog>(entity =>
        {
            entity.HasKey(o => o.Id);

            entity.HasOne(o => o.Library)
                .WithMany(l => l.OccupancyLogs)
                .HasForeignKey(o => o.LibraryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(o => o.User)
                .WithMany(u => u.OccupancyLogs)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Token).IsUnique();

            entity.HasOne(r => r.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SQLite has no timezone-aware datetime column type - every DateTime this app writes
        // is DateTime.UtcNow (or derived from it, e.g. RefreshToken.ExpiresAt), but EF Core's
        // Sqlite provider round-trips a written Kind=Utc value back as Kind=Unspecified on
        // read. System.Text.Json's default DateTime converter only appends the "Z" UTC
        // designator when Kind=Utc, so every DateTime read from the DB (as opposed to one
        // still held in memory right after being constructed) was serialized WITHOUT "Z" -
        // e.g. "2026-07-31T14:23:00" instead of "...Z". Clients then parse that ambiguous
        // string as LOCAL time per the ECMAScript Date Time String Format spec, silently
        // shifting it by the client's UTC offset (this was the root cause of
        // ActiveCheckInBanner showing an elapsed time equal to the device's timezone offset
        // immediately after check-in). Re-stamping Kind=Utc on every read - for every
        // DateTime/DateTime? property, not just OccupancyLog.Timestamp - fixes this at the
        // source instead of requiring every DTO/consumer to know about the SQLite quirk.
        var utcDateTimeConverter = new ValueConverter<DateTime, DateTime>(
            v => v,
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        var utcNullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(utcDateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(utcNullableDateTimeConverter);
                }
            }
        }

        base.OnModelCreating(modelBuilder);
    }
}
