namespace InventoryProxy.Models;

public record Warehouse(string Id, string Name, string City, double Latitude, double Longitude)
{
    /// <summary>Great-circle distance (haversine), good enough to rank warehouses by proximity.</summary>
    public double DistanceKmTo(double latitude, double longitude)
    {
        static double Rad(double deg) => deg * Math.PI / 180;
        var a = Math.Pow(Math.Sin(Rad(latitude - Latitude) / 2), 2) +
                Math.Cos(Rad(Latitude)) * Math.Cos(Rad(latitude)) * Math.Pow(Math.Sin(Rad(longitude - Longitude) / 2), 2);
        return Math.Round(2 * 6371 * Math.Asin(Math.Sqrt(a)), 1);
    }
}
