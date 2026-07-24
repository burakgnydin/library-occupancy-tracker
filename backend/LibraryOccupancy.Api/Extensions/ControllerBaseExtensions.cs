using System.Security.Claims;

namespace LibraryOccupancy.Api.Extensions;

public static class ControllerBaseExtensions
{
    public static Guid GetCurrentUserId(this ControllerBase controller)
    {
        return Guid.Parse(controller.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
