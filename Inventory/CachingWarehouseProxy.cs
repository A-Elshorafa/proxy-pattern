using InventoryProxy.Models;

namespace InventoryProxy.Inventory;

/// <summary>
/// <b>Proxy.</b> Same interface as the real warehouse, and wraps it.
/// Stock reads come from a cache until it expires. Writes always go to the real warehouse, then the cache is cleared.
/// </summary>
public class CachingWarehouseProxy(IWarehouseInventory real, TimeSpan ttl) : IWarehouseInventory
{
    private StockSnapshot? _cached;

    public Warehouse Warehouse => real.Warehouse;

    public async Task<StockSnapshot> GetStockAsync()
    {
        var cached = _cached;
        if (cached is not null && DateTime.UtcNow - cached.CapturedAt < ttl)
        {
            ProxyStats.RecordCacheHit();
            return cached;
        }

        ProxyStats.RecordCacheMiss();
        _cached = await real.GetStockAsync();
        return _cached;
    }

    public async Task<Guid> ReserveAsync(List<OrderLine> lines)
    {
        // Clear the cache even if the reservation fails: a failure means the cached stock was wrong.
        try { return await real.ReserveAsync(lines); }
        finally { _cached = null; }
    }

    public async Task RestockAsync(string sku, int quantity)
    {
        try { await real.RestockAsync(sku, quantity); }
        finally { _cached = null; }
    }
}
