namespace LibraryOccupancy.Api.Services.Exceptions;

public class NotFoundException : Exception
{
    public string ErrorCode { get; }

    public NotFoundException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }
}
