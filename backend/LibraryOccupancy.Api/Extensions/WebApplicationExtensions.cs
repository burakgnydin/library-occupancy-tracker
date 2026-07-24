using LibraryOccupancy.Api.Middleware;
using Scalar.AspNetCore;
using Serilog;

namespace LibraryOccupancy.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureMiddleware(this WebApplication app)
    {
        app.UseMiddleware<ExceptionHandlingMiddleware>();

        app.UseSerilogRequestLogging();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference("/scalar");
        }

        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseRateLimiter();
        app.UseAuthorization();
        app.MapControllers();

        return app;
    }
}
