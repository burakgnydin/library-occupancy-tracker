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

        // UseAuthentication MUST come before UseRateLimiter: ServiceCollectionExtensions.
        // AddRateLimiting's CheckInOutRateLimitPolicy partitions by ClaimTypes.NameIdentifier
        // (HttpContext.User), so the JWT needs to already be validated and its claims populated by
        // the time the rate limiter's partition-key selector runs. Reverse this order and
        // HttpContext.User has no claims yet on every request - the partition key selector's ??
        // "unknown" fallback fires every time, silently collapsing every authenticated user onto
        // one shared check-in/check-out rate limit instead of their own. No exception, no build
        // error, just a throttling bug that only shows up under real multi-user load.
        //
        // UseRateLimiter before UseAuthorization is not load-bearing the same way - a rejected
        // (429) request short-circuits the pipeline without throwing, so it doesn't matter whether
        // authorization would also have rejected it. It's ordered this way simply so a request that
        // is going to be throttled anyway doesn't pay for the (cheap, but non-zero) authorization
        // check first.
        app.UseAuthentication();
        app.UseRateLimiter();
        app.UseAuthorization();
        app.MapControllers();
        app.MapHub<OccupancyHub>(OccupancyHub.RoutePattern);

        return app;
    }
}
