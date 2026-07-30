namespace LibraryOccupancy.Api.Hubs;

public class OccupancyHub : Hub
{
    public const string RoutePattern = "/hubs/occupancy";

    private readonly ILibraryRepository _libraryRepository;

    public OccupancyHub(ILibraryRepository libraryRepository)
    {
        _libraryRepository = libraryRepository;
    }

    // Silently skips the join for an unknown libraryId instead of throwing - a client sending a
    // stale/bogus id shouldn't be able to tear down its own SignalR connection over what's just
    // a subscription no-op. ExistsAsync is a cheap existence check, not a full entity load.
    public async Task JoinLibraryGroup(Guid libraryId)
    {
        if (!await _libraryRepository.ExistsAsync(libraryId))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(libraryId));
    }

    public Task LeaveLibraryGroup(Guid libraryId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(libraryId));

    public static string GroupName(Guid libraryId) => $"library-{libraryId}";
}
