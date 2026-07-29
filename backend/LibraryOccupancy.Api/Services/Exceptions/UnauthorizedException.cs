namespace LibraryOccupancy.Api.Services.Exceptions;

public class UnauthorizedException : Exception
{
    public string ErrorCode { get; }

    public UnauthorizedException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }
}
