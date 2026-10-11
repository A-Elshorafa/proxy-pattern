using InventoryProxy.Inventory;
using InventoryProxy.Models;
using InventoryProxy.Services;

var builder = WebApplication.CreateBuilder(args);

var useProxy = builder.Configuration.GetValue("UseCachingProxy", true);
var cacheTtl = TimeSpan.FromSeconds(builder.Configuration.GetValue("CacheTtlSeconds", 30));
var latency = TimeSpan.FromMilliseconds(builder.Configuration.GetValue("RemoteLatencyMs", 400));

// This is the only place that chooses between the real warehouse and the proxy.
var warehouses = SeedData.Warehouses()
    .Select(seed => (IWarehouseInventory)new RemoteWarehouseInventory(seed.Warehouse, seed.Stock, latency))
    .Select(real => useProxy ? new CachingWarehouseProxy(real, cacheTtl) : real)
    .ToList();

builder.Services.AddSingleton(new FulfillmentService(warehouses));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o => o.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "InventoryProxy.xml")));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(o => o.RoutePrefix = "swagger");
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

static string? Validate(FulfillmentRequest req)
{
    if (req.Lines.Count == 0) return "At least one order line is required.";
    if (req.Lines.Any(l => string.IsNullOrWhiteSpace(l.Sku) || l.Quantity <= 0)) return "Every line needs a SKU and a quantity above 0.";
    if (req.DestinationLatitude is < -90 or > 90 || req.DestinationLongitude is < -180 or > 180) return "Destination coordinates are out of range.";
    return null;
}

app.MapPost("/api/fulfillment/search", async (FulfillmentRequest req, FulfillmentService svc) =>
    Validate(req) is { } error ? Results.BadRequest(error) : Results.Ok(await svc.SearchAsync(req)))
.WithSummary("Find the nearest warehouse that has every item (read-only). Run it twice to see the proxy cache.");

app.MapPost("/api/fulfillment/orders", async (FulfillmentRequest req, FulfillmentService svc) =>
{
    if (Validate(req) is { } error) return Results.BadRequest(error);
    var result = await svc.PlaceOrderAsync(req);
    return result.ReservationId is null ? Results.Conflict(result) : Results.Ok(result);
})
.WithSummary("Pick the best warehouse and reserve the stock. Falls back to the next one if the cache was stale.");

app.MapGet("/api/warehouses", (FulfillmentService svc) => svc.Warehouses.Select(w => w.Warehouse))
.WithSummary("List warehouses");

app.MapGet("/api/warehouses/{id}/stock", async (string id, FulfillmentService svc) =>
    svc.Find(id) is { } w ? Results.Ok(await w.GetStockAsync()) : Results.NotFound($"Warehouse {id} not found."))
.WithSummary("Stock of one warehouse, read through the proxy");

app.MapPost("/api/warehouses/{id}/restock", async (string id, RestockRequest req, FulfillmentService svc) =>
{
    if (string.IsNullOrWhiteSpace(req.Sku) || req.Quantity <= 0) return Results.BadRequest("A SKU and a quantity above 0 are required.");
    if (svc.Find(id) is not { } w) return Results.NotFound($"Warehouse {id} not found.");

    await w.RestockAsync(req.Sku.Trim().ToUpperInvariant(), req.Quantity);
    return Results.Ok(await w.GetStockAsync());
})
.WithSummary("Add stock. The proxy passes it to the warehouse and clears its cache");

app.MapGet("/api/proxy/stats", () => new
{
    useProxy,
    cacheTtlSeconds = cacheTtl.TotalSeconds,
    remoteCalls = ProxyStats.RemoteCalls,
    cacheHits = ProxyStats.CacheHits,
    cacheMisses = ProxyStats.CacheMisses,
})
.WithSummary("How many calls reached the warehouses vs. were answered by the proxy");

app.MapDelete("/api/proxy/stats", () => { ProxyStats.Reset(); return Results.NoContent(); })
.WithSummary("Reset the counters");

app.Run();
