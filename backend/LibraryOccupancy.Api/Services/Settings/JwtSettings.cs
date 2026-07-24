namespace LibraryOccupancy.Api.Services.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; set; } = 20;
    public int RefreshTokenExpiryDays { get; set; } = 30;
}
