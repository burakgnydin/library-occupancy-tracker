using System.Security.Cryptography;
using System.Text;

namespace LibraryOccupancy.Api.Services;

public static class RefreshTokenHasher
{
    public static string Hash(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToBase64String(bytes);
    }
}
