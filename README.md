# Proxy Pattern – Warehouse Inventory Fulfillment (.NET 10)

## What is the Proxy pattern?

A **Proxy** is an object with the **same interface** as another object (the *real subject*). It wraps the real object and controls access to it, for example by caching, checking permissions, or loading lazily. The code using it can't tell which of the two it has.

Here, an incoming order must be shipped from one warehouse that has every item. Each warehouse has its own inventory system, and every call to it is slow (simulated at 400 ms). A **caching proxy** in front of each warehouse keeps a recent copy of its stock, so repeated lookups don't call the warehouse again.

## Structure

```
IWarehouseInventory              ◄── Subject     (Inventory/IWarehouseInventory.cs)
 ├── RemoteWarehouseInventory    ◄── Real Subject: slow, always correct
 └── CachingWarehouseProxy       ◄── Proxy: wraps the real one, caches stock reads

FulfillmentService               ◄── Client: only knows IWarehouseInventory
```

- **Reads** (`GetStockAsync`): the proxy returns the cached stock until it is 30 s old.
- **Writes** (`ReserveAsync`, `RestockAsync`): always sent to the real warehouse, then the cache is cleared.
- **Out-of-date cache is safe**: the real warehouse checks stock again when reserving. If it's no longer there, the reservation fails and `FulfillmentService` tries the next nearest warehouse (shown in `skipped`).
- `Program.cs` is the only place that decides whether the proxy is used. Set `"UseCachingProxy": false` in `appsettings.json` and nothing else changes, except every lookup becomes slow.

## Run

```bash
dotnet run
```

Swagger UI: http://localhost:8096/swagger

## Seed data

| Warehouse | City | LAPTOP-15 | PHONE-X | HEADSET-PRO | MONITOR-27 | KEYBOARD-MX | CHAIR-ERGO |
|---|---|---|---|---|---|---|---|
| CAI-01 | Cairo | 5 | 20 | 10 | **0** | 15 | – |
| MNS-01 | Mansoura | **2** | 10 | 4 | 5 | 10 | – |
| ALX-01 | Alexandria | 12 | 3 | – | 8 | 4 | 6 |
| ASW-01 | Aswan | 30 | 30 | 30 | 30 | 30 | 30 |

## Endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/fulfillment/search` | Rank warehouses and pick the nearest one that has everything (read-only) |
| POST | `/api/fulfillment/orders` | Pick a warehouse and reserve the stock (409 if none can) |
| GET | `/api/warehouses` | List warehouses |
| GET | `/api/warehouses/{id}/stock` | Stock of one warehouse, read through the proxy |
| POST | `/api/warehouses/{id}/restock` | Add stock; the proxy clears its cache |
| GET | `/api/proxy/stats` | Calls that reached the warehouses vs. cache hits/misses |
| DELETE | `/api/proxy/stats` | Reset the counters |

## Try it in Swagger

1. `POST /api/fulfillment/search` with the default body (2 × `LAPTOP-15` + 1 × `MONITOR-27`, delivered to Cairo). Cairo has no monitors, so **MNS-01** is picked. `elapsedMs` ≈ 400.
2. Run it again: `elapsedMs` ≈ 0 and `stockCapturedAt` is unchanged. The proxy answered.
3. `POST /api/fulfillment/orders` with the same body reserves at MNS-01 and clears its cache.
4. Search again: MNS-01 is out of laptops now, so **ALX-01** is picked. Only MNS-01 was fetched again.
5. `GET /api/proxy/stats` shows how many warehouse calls were saved.
