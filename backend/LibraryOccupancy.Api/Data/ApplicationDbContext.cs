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

        base.OnModelCreating(modelBuilder);
    }
}
