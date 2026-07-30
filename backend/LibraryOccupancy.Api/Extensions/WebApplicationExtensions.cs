using LibraryOccupancy.Api.Middleware;
using Scalar.AspNetCore;
using Serilog;

namespace LibraryOccupancy.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureMiddleware(this WebApplication app)
    {
        // Serilog's request-logging middleware must wrap OUTSIDE (registered before)
        // ExceptionHandlingMiddleware so it logs the request AFTER our middleware has already
        // turned a known exception into a proper status code + response body. With the reverse
        // order, an exception thrown deep in the pipeline first passes through Serilog's
        // middleware (still unhandled), which logs it as its own misleading [ERR] "... responded
        // 500 ..." line with a full stack trace, before propagating out to us - producing two log
        // entries (one wrong, one right) for every NotFoundException/ValidationException/etc.
        app.UseSerilogRequestLogging();

        app.UseMiddleware<ExceptionHandlingMiddleware>();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference("/scalar");
        }

        app.UseHttpsRedirection();
        app.UseCors(ServiceCollectionExtensions.CorsPolicyName);
        app.UseAuthentication();
        app.UseRateLimiter();
        app.UseAuthorization();
        app.MapControllers();
        app.MapHub<OccupancyHub>(OccupancyHub.RoutePattern);

        return app;
    }
}
