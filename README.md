# Proxy Pattern – Warehouse Inventory Fulfillment (.NET 10 + React)

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

## Project layout

```
InventoryProxy/
├── Program.cs                        endpoints + the one place that picks the proxy or the real warehouse
├── Inventory/                        Subject, Real Subject, Proxy, counters, seed data
├── Services/FulfillmentService.cs    Client: picks the nearest warehouse that has everything
├── Models/                           one record/class per file
└── ClientApp/                        React + Tailwind tester (Vite)
    └── src/
        ├── App.jsx                   page state and actions
        ├── api.js                    calls to the backend
        ├── styles.js                 shared Tailwind class strings
        └── components/               StatsBar, OrderForm, ResultPanel, WarehouseCard, ActivityLog
```

## Run

Backend (terminal 1):

```bash
dotnet run
```

Swagger UI: http://localhost:8097/swagger

Client (terminal 2):

```bash
cd ClientApp && npm install && npm run dev
```

Client: http://localhost:8098

Vite forwards `/api` calls to the backend on port 8097, so no CORS setup is needed. Start the backend first.

## Client app

A one-page tester for the proxy:

- **Proxy counters** (top): whether the proxy is on, the cache TTL, warehouse calls, cache hits and misses, and the hit ratio, with a reset button.
- **Incoming order**: add, edit or remove SKU lines (with SKU suggestions) and pick a delivery city.
  - **Find warehouse** only reads stock.
  - **Place order** reserves the stock.
- **Result**: the warehouses ranked by fitness and distance. It shows the chosen one, any missing items, and how old each stock reading is. A badge shows the server time: green when the proxy answered from its cache, amber when warehouse systems were called. For orders, it shows the reservation id and any warehouses skipped because the cached stock was out of date.
- **Activity**: the last actions and how long each took, measured in the browser.
- **Warehouses**: the current stock of each warehouse (read through the proxy), how long until its cache expires, and a restock form.

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

## Try it in the client

Loading the page reads every warehouse's stock through the proxy, so the cache is already warm.

1. Wait until the warehouse cards say **cache expired** (30 s), then click **Find warehouse** with the default order (2 × `LAPTOP-15` + 1 × `MONITOR-27`, delivered to Cairo). Cairo has no monitors, so **Mansoura** is chosen. The badge is amber, about 400 ms.
2. Click **Find warehouse** again. The badge turns green (about 0 ms), and the cache-hit counter goes up.
3. Click **Place order**. The stock is reserved at Mansoura and only Mansoura's cache is cleared. Its card shows a fresh capture time and 0 laptops.
4. Click **Find warehouse** again. **Alexandria** is chosen now.
5. Restock `LAPTOP-15` at Mansoura. Its card updates at once, because the proxy cleared its cache.

## Try it in Swagger

1. `POST /api/fulfillment/search` with the default body (2 × `LAPTOP-15` + 1 × `MONITOR-27`, delivered to Cairo). Cairo has no monitors, so **MNS-01** is picked. `elapsedMs` ≈ 400.
2. Run it again: `elapsedMs` ≈ 0 and `stockCapturedAt` is unchanged. The proxy answered.
3. `POST /api/fulfillment/orders` with the same body reserves at MNS-01 and clears its cache.
4. Search again: MNS-01 is out of laptops now, so **ALX-01** is picked. Only MNS-01 was fetched again.
5. `GET /api/proxy/stats` shows how many warehouse calls were saved.
