namespace InventoryProxy.Models;

public record Candidate(string WarehouseId, string Name, string City, double DistanceKm, bool CanFulfill,
    List<string> Missing, DateTime StockCapturedAt);
