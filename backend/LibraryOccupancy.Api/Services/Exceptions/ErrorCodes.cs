namespace LibraryOccupancy.Api.Services.Exceptions;

// Her custom exception'in tasidigi, koda gomulu/sabit Ingilizce kod - Exception.Message
// (log icin serbest metin, degisebilir) ile karistirilmamali. ExceptionHandlingMiddleware
// bu kodu ErrorMessages.Resolve() ile kullaniciya donen TURKCE mesaja cevirir.
public static class ErrorCodes
{
    public const string LibraryNotFound = "LIBRARY_NOT_FOUND";
    public const string UserNotFound = "USER_NOT_FOUND";

    public const string LibraryNameAddressConflict = "LIBRARY_NAME_ADDRESS_CONFLICT";
    public const string EmailAlreadyRegistered = "EMAIL_ALREADY_REGISTERED";

    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string InvalidRefreshToken = "INVALID_REFRESH_TOKEN";

    public const string AlreadyCheckedIn = "ALREADY_CHECKED_IN";
    public const string LibraryFull = "LIBRARY_FULL";
    public const string NotCheckedIn = "NOT_CHECKED_IN";
    public const string CheckedInElsewhere = "CHECKED_IN_ELSEWHERE";
    public const string OccupancyAlreadyZero = "OCCUPANCY_ALREADY_ZERO";
    public const string InvalidQrCode = "INVALID_QR_CODE";

    public const string CannotCreateSuperAdmin = "CANNOT_CREATE_SUPERADMIN";
    public const string CannotChangeOwnRole = "CANNOT_CHANGE_OWN_ROLE";
    public const string CannotDeleteOwnAccount = "CANNOT_DELETE_OWN_ACCOUNT";
    public const string ProfileAccessDenied = "PROFILE_ACCESS_DENIED";
}
