using System.Diagnostics;
using InventoryProxy.Inventory;
using InventoryProxy.Models;

namespace InventoryProxy.Services;

/// <summary>
/// <b>Client.</b> Finds the nearest warehouse that has every item in the order.
/// It only uses <see cref="IWarehouseInventory"/> and never knows whether a proxy is in front.
/// </summary>
public class FulfillmentService(List<IWarehouseInventory> warehouses)
{
    public List<IWarehouseInventory> Warehouses => warehouses;

    public IWarehouseInventory? Find(string id) =>
        warehouses.FirstOrDefault(w => w.Warehouse.Id.Equals(id, StringComparison.OrdinalIgnoreCase));

    public async Task<SearchResult> SearchAsync(FulfillmentRequest request)
    {
        var timer = Stopwatch.StartNew();
        var candidates = await RankAsync(MergeLines(request.Lines), request);
        return new SearchResult(candidates.FirstOrDefault(c => c.CanFulfill), candidates, timer.Elapsed.TotalMilliseconds);
    }

    public async Task<OrderResult> PlaceOrderAsync(FulfillmentRequest request)
    {
        var timer = Stopwatch.StartNew();
        var lines = MergeLines(request.Lines);
        var candidates = await RankAsync(lines, request);
        var skipped = new List<string>();

        foreach (var candidate in candidates.Where(c => c.CanFulfill))
        {
            try
            {
                var reservationId = await Find(candidate.WarehouseId)!.ReserveAsync(lines);
                return new OrderResult(reservationId, candidate, skipped, candidates, timer.Elapsed.TotalMilliseconds);
            }
            catch (InvalidOperationException ex)
            {
                // The cached stock was out of date. Try the next nearest warehouse.
                skipped.Add(ex.Message);
            }
        }

        return new OrderResult(null, null, skipped, candidates, timer.Elapsed.TotalMilliseconds);
    }

    private async Task<List<Candidate>> RankAsync(List<OrderLine> lines, FulfillmentRequest request)
    {
        // Ask all warehouses at the same time. With the proxy, repeat lookups come from the cache.
        var candidates = await Task.WhenAll(warehouses.Select(async inventory =>
        {
            var stock = await inventory.GetStockAsync();
            var w = inventory.Warehouse;
            var missing = lines
                .Where(l => stock.Levels.GetValueOrDefault(l.Sku) < l.Quantity)
                .Select(l => $"{l.Sku} (needs {l.Quantity}, has {stock.Levels.GetValueOrDefault(l.Sku)})")
                .ToList();

            return new Candidate(w.Id, w.Name, w.City, w.DistanceKmTo(request.DestinationLatitude, request.DestinationLongitude),
                missing.Count == 0, missing, stock.CapturedAt);
        }));

        return candidates.OrderByDescending(c => c.CanFulfill).ThenBy(c => c.DistanceKm).ToList();
    }

    // "2 laptops + 1 laptop" is checked as 3 laptops.
    private static List<OrderLine> MergeLines(List<OrderLine> lines) =>
        lines.GroupBy(l => l.Sku.Trim().ToUpperInvariant())
             .Select(g => new OrderLine { Sku = g.Key, Quantity = g.Sum(l => l.Quantity) })
             .ToList();
}
