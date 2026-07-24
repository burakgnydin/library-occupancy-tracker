using System.Net;

namespace LibraryOccupancy.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (NotFoundException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (ValidationException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (ConflictException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.Conflict, ex.Message);
        }
        catch (UnauthorizedException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (ForbiddenException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.Forbidden, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred while processing {Path}", context.Request.Path);
            await WriteErrorResponseAsync(context, HttpStatusCode.InternalServerError, "Beklenmeyen bir hata oluştu.");
        }
    }

    private static Task WriteErrorResponseAsync(HttpContext context, HttpStatusCode statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        return context.Response.WriteAsJsonAsync(new { message });
    }
}
