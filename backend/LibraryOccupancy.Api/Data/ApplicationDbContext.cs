namespace LibraryOccupancy.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Library> Libraries => Set<Library>();
    public DbSet<User> Users => Set<User>();
    public DbSet<OccupancyLog> OccupancyLogs => Set<OccupancyLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Library>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.HasIndex(l => l.QrCodeToken).IsUnique();
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

        base.OnModelCreating(modelBuilder);
    }
}
