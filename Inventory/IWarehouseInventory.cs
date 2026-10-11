using InventoryProxy.Models;

namespace InventoryProxy.Inventory;

/// <summary>
/// <b>Subject.</b> What the app needs from a warehouse. The real warehouse and the proxy
/// both implement it, so the code using it can't tell which one it has.
/// </summary>
public interface IWarehouseInventory
{
    Warehouse Warehouse { get; }
    Task<StockSnapshot> GetStockAsync();

    /// <summary>Takes the items out of stock. Throws <see cref="InvalidOperationException"/> if they aren't there.</summary>
    Task<Guid> ReserveAsync(List<OrderLine> lines);

    Task RestockAsync(string sku, int quantity);
}
