namespace InventoryProxy.Models;

public class OrderLine
{
    /// <example>LAPTOP-15</example>
    public string Sku { get; set; } = "";

    /// <example>2</example>
    public int Quantity { get; set; }
}
