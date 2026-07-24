namespace LibraryOccupancy.Api.Services;

public static class OccupancyCalculator
{
    public static int CalculatePercentage(int currentOccupancy, int capacity)
    {
        if (capacity <= 0)
        {
            return 0;
        }

        return (int)Math.Round(currentOccupancy / (double)capacity * 100);
    }

    public static OccupancyStatus CalculateStatus(int occupancyPercentage)
    {
        return occupancyPercentage switch
        {
            >= 85 => OccupancyStatus.High,
            >= 60 => OccupancyStatus.Medium,
            _ => OccupancyStatus.Low
        };
    }
}
