namespace LibraryOccupancy.Api.DTOs.Library;

public class LibraryQueryParameters
{
    private int _pageNumber = 1;
    private int _pageSize = 10;

    public string? Search { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }

    // Deliberately forgiving rather than strict: an out-of-range PageNumber/PageSize is silently
    // clamped to the nearest valid value instead of failing model validation with a 400. This is a
    // conscious API design choice (a stray ?pageSize=0 or ?pageSize=9999 from a client just gets a
    // sane result instead of an error), not an oversight — do not "fix" it into throwing without
    // discussing the tradeoff first.
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

    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}
