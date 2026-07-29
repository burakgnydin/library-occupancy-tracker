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
            await HandleKnownExceptionAsync(context, HttpStatusCode.NotFound, ex.ErrorCode, ex.Message);
        }
        catch (ValidationException ex)
        {
            await HandleKnownExceptionAsync(context, HttpStatusCode.BadRequest, ex.ErrorCode, ex.Message);
        }
        catch (ConflictException ex)
        {
            await HandleKnownExceptionAsync(context, HttpStatusCode.Conflict, ex.ErrorCode, ex.Message);
        }
        catch (UnauthorizedException ex)
        {
            await HandleKnownExceptionAsync(context, HttpStatusCode.Unauthorized, ex.ErrorCode, ex.Message);
        }
        catch (ForbiddenException ex)
        {
            await HandleKnownExceptionAsync(context, HttpStatusCode.Forbidden, ex.ErrorCode, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred while processing {Path}", context.Request.Path);
            await WriteErrorResponseAsync(context, HttpStatusCode.InternalServerError, ErrorMessages.Fallback);
        }
    }

    // Bilinen (beklenen) is exception'lari icin ortak yol: log'a Ingilizce
    // Exception.Message + ErrorCode yazilir (gelistirici/debug icin), ama HTTP
    // response'ta kullaniciya SADECE ErrorMessages.Resolve()'un dondurdugu
    // TURKCE metin gonderilir - ham Exception.Message asla client'a sizmaz.
    private Task HandleKnownExceptionAsync(HttpContext context, HttpStatusCode statusCode, string errorCode, string logMessage)
    {
        _logger.LogWarning("Handled exception [{ErrorCode}]: {Message}", errorCode, logMessage);
        return WriteErrorResponseAsync(context, statusCode, ErrorMessages.Resolve(errorCode));
    }

    private static Task WriteErrorResponseAsync(HttpContext context, HttpStatusCode statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        return context.Response.WriteAsJsonAsync(new { message });
    }
}
