using InventoryProxy.Models;

namespace InventoryProxy.Inventory;

/// <summary>
/// <b>Real Subject.</b> The warehouse's own inventory system. Always correct, but every call is a
/// slow network round-trip (simulated with a delay).
/// </summary>
public class RemoteWarehouseInventory(Warehouse warehouse, Dictionary<string, int> stock, TimeSpan latency) : IWarehouseInventory
{
    private readonly Dictionary<string, int> _stock = new(stock, StringComparer.OrdinalIgnoreCase);
    private readonly Lock _lock = new();

    public Warehouse Warehouse => warehouse;

    public async Task<StockSnapshot> GetStockAsync()
    {
        await CallNetworkAsync();
        lock (_lock) return new StockSnapshot(warehouse.Id, new(_stock, StringComparer.OrdinalIgnoreCase), DateTime.UtcNow);
    }

    public async Task<Guid> ReserveAsync(List<OrderLine> lines)
    {
        await CallNetworkAsync();
        lock (_lock)
        {
            // Check against the real stock, not whatever the caller saw earlier.
            var missing = lines.Where(l => _stock.GetValueOrDefault(l.Sku) < l.Quantity).Select(l => l.Sku).ToList();
            if (missing.Count > 0)
                throw new InvalidOperationException($"{warehouse.Id} no longer has enough of: {string.Join(", ", missing)}");

            foreach (var line in lines) _stock[line.Sku] -= line.Quantity;
            return Guid.NewGuid();
        }
    }

    public async Task RestockAsync(string sku, int quantity)
    {
        await CallNetworkAsync();
        lock (_lock) _stock[sku] = _stock.GetValueOrDefault(sku) + quantity;
    }

    private Task CallNetworkAsync()
    {
        ProxyStats.RecordRemoteCall();
        return Task.Delay(latency);
    }
}
