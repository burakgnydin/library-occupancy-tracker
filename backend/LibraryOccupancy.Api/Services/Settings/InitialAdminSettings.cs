namespace LibraryOccupancy.Api.Services.Settings;

public class InitialAdminSettings
{
    public const string SectionName = "InitialAdmin";

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
