using LibraryOccupancy.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureSerilog();
builder.Services.AddApplicationServices(builder.Configuration);

var app = builder.Build();

app.ConfigureMiddleware();

app.Run();
