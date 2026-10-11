namespace InventoryProxy.Models;

/// <summary>A warehouse's stock as it was at <see cref="CapturedAt"/>. From the cache it may be out of date.</summary>
public record StockSnapshot(string WarehouseId, Dictionary<string, int> Levels, DateTime CapturedAt);
