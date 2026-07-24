using LibraryOccupancy.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureSerilog();
builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);

var app = builder.Build();

app.ValidateAutoMapperConfiguration();
await app.SeedInitialAdminAsync();

app.ConfigureMiddleware();

app.Run();
