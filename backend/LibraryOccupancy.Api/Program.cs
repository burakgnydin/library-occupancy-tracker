using System.Globalization;
using LibraryOccupancy.Api.Extensions;

// Pinned before anything else runs: ASP.NET Core's built-in DataAnnotations validation messages
// (Required/EmailAddress/MaxLength/MinLength/Range) are resolved from the framework's own resx
// resources based on CurrentUICulture, which otherwise defaults to whatever the host OS/container
// locale is. ValidationMessageFormatter (Services/Exceptions/ValidationMessageFormatter.cs)
// pattern-matches those messages assuming they're in English - on a non-English host locale they
// silently stop matching and every validation error falls back to a generic message instead of
// throwing or logging anything. Pinning both culture properties to InvariantCulture (which resolves
// to the neutral/English resource) makes that message text deployment-locale-independent.
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.InvariantCulture;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureSerilog();
builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);

var app = builder.Build();

app.ValidateAutoMapperConfiguration();
app.ValidateFieldDisplayNamesConfiguration();
await app.SeedInitialAdminAsync();

app.ConfigureMiddleware();

app.Run();
