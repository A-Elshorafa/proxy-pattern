import { useEffect, useState } from 'react'
import { getStats, getStock, listWarehouses, placeOrder, resetStats, restock, searchFulfillment } from './api.js'
import { ghostCls } from './styles.js'
import ActivityLog from './components/ActivityLog.jsx'
import OrderForm from './components/OrderForm.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import StatsBar from './components/StatsBar.jsx'
import WarehouseCard from './components/WarehouseCard.jsx'

export default function App() {
  const [warehouses, setWarehouses] = useState([])
  const [stocks, setStocks] = useState({})
  const [stats, setStats] = useState(null)
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  // Ticks every second so "captured Xs ago" and cache countdowns stay current.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const skus = [...new Set(Object.values(stocks).flatMap((s) => Object.keys(s.levels)))].sort()

  const addLog = (entry) =>
    setLog((prev) => [{ id: crypto.randomUUID(), time: new Date().toLocaleTimeString(), ...entry }, ...prev].slice(0, 12))

  // Runs one action, times it in the browser, logs it and refreshes the proxy counters.
  const run = async (label, action) => {
    setBusy(true)
    setError('')
    const started = performance.now()
    try {
      const value = await action()
      addLog({ label, ms: Math.round(performance.now() - started) })
      return value
    } catch (err) {
      setError(err.message)
      addLog({ label, error: 'failed' })
    } finally {
      setStats(await getStats().catch(() => null))
      setBusy(false)
    }
  }

  const loadStocks = async (list) => {
    const snapshots = await Promise.all(list.map((w) => getStock(w.id)))
    setStocks(Object.fromEntries(snapshots.map((s) => [s.warehouseId, s])))
  }

  useEffect(() => {
    run('Load warehouses', async () => {
      const list = await listWarehouses()
      setWarehouses(list)
      await loadStocks(list)
    })
  }, [])

  const actions = {
    search: (order) => run('Find warehouse', async () => setResult({ kind: 'search', data: await searchFulfillment(order) })),
    order: (order) =>
      run('Place order', async () => {
        setResult({ kind: 'order', data: await placeOrder(order) })
        await loadStocks(warehouses)
      }),
    refreshStock: () => run('Refresh stock', () => loadStocks(warehouses)),
    restock: (id, sku, quantity) =>
      run(`Restock ${quantity} × ${sku} at ${id}`, async () => {
        const snapshot = await restock(id, sku, quantity)
        setStocks((prev) => ({ ...prev, [id]: snapshot }))
      }),
    resetStats: () => run('Reset counters', resetStats),
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Inventory Proxy</h1>
        <p className="text-sm text-slate-600">
          Each warehouse system takes ~400 ms to answer. A caching proxy with the same interface sits in front of each one,
          so repeat stock lookups are answered without calling the warehouse.
        </p>
      </header>

      {/* SKU suggestions shared by every SKU input on the page. */}
      <datalist id="skus">{skus.map((s) => <option key={s} value={s} />)}</datalist>

      <StatsBar stats={stats} onReset={actions.resetStats} busy={busy} />

      {error && (
        <div className="flex items-start justify-between gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
          <span>{error}</span>
          <button className="font-medium" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <OrderForm onSearch={actions.search} onOrder={actions.order} busy={busy} />
          <ActivityLog entries={log} />
        </div>
        <ResultPanel result={result} now={now} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Warehouses</h2>
          <button className={ghostCls} disabled={busy} onClick={actions.refreshStock}>Refresh stock</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {warehouses.map((w) => (
            <WarehouseCard key={w.id} warehouse={w} stock={stocks[w.id]} stats={stats} now={now}
              onRestock={actions.restock} busy={busy} />
          ))}
        </div>
      </section>
    </div>
  )
}
