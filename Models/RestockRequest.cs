namespace InventoryProxy.Models;

public class RestockRequest
{
    /// <example>MONITOR-27</example>
    public string Sku { get; set; } = "";

    /// <example>10</example>
    public int Quantity { get; set; }
}
