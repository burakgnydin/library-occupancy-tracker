namespace LibraryOccupancy.Api.Services.Exceptions;

public class ForbiddenException : Exception
{
    public string ErrorCode { get; }

    public ForbiddenException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }
}
