namespace LibraryOccupancy.Api.Models;

// Id/CreatedAt are assigned via property initializers, so every write path (services,
// DatabaseSeeder) gets a fresh value for free on `new()` instead of repeating
// "Id = Guid.NewGuid(); CreatedAt = DateTime.UtcNow;" per entity. This doesn't change
// EF Core materialization: on read, EF sets these from the actual column values right
// after construction, overwriting the temporary initializer values.
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
