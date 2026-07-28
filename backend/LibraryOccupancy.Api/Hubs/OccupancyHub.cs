namespace LibraryOccupancy.Api.Hubs;

public class OccupancyHub : Hub
{
    public const string RoutePattern = "/hubs/occupancy";

    public Task JoinLibraryGroup(Guid libraryId)
        => Groups.AddToGroupAsync(Context.ConnectionId, GroupName(libraryId));

    public Task LeaveLibraryGroup(Guid libraryId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(libraryId));

    public static string GroupName(Guid libraryId) => $"library-{libraryId}";
}
