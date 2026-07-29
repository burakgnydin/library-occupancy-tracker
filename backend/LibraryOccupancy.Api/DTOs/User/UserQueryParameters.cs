namespace LibraryOccupancy.Api.DTOs.User;

public class UserQueryParameters
{
    private int _pageNumber = 1;
    private int _pageSize = 10;

    public string? Search { get; set; }
    public UserRole? Role { get; set; }

    // LibraryQueryParameters ile ayni "forgiving" davranis (bkz. o dosyadaki
    // yorum) - gecersiz bir PageNumber/PageSize 400 yerine en yakin gecerli
    // degere sabitlenir.
    public int PageNumber
    {
        get => _pageNumber;
        set => _pageNumber = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value switch
        {
            < 1 => 10,
            > 50 => 50,
            _ => value
        };
    }
}
