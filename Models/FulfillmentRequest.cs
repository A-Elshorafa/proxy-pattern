namespace InventoryProxy.Models;

public class FulfillmentRequest
{
    public List<OrderLine> Lines { get; set; } = [];

    /// <summary>Delivery latitude (example: Cairo).</summary>
    /// <example>30.0444</example>
    public double DestinationLatitude { get; set; }

    /// <summary>Delivery longitude (example: Cairo).</summary>
    /// <example>31.2357</example>
    public double DestinationLongitude { get; set; }
}
