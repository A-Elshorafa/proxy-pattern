import { useState } from 'react'
import { btnCls, cardCls, fieldCls, secondsSince } from '../styles.js'

export default function WarehouseCard({ warehouse, stock, stats, now, onRestock, busy }) {
  const [sku, setSku] = useState('')
  const [quantity, setQuantity] = useState('5')

  const age = stock ? secondsSince(stock.capturedAt, now) : null
  const cacheLeft = stats?.useProxy && age != null ? Math.max(0, stats.cacheTtlSeconds - age) : 0

  return (
    <div className={cardCls}>
      <div className="mb-2">
        <h3 className="font-semibold text-slate-800">
          <span className="mr-2 text-xs font-normal text-slate-400">{warehouse.id}</span>{warehouse.name}
        </h3>
        <div className="text-sm text-slate-500">{warehouse.city}</div>
      </div>

      {stock ? (
        <>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(stock.levels).map(([s, q]) => (
              <li key={s} className="flex justify-between">
                <span className="text-slate-600">{s}</span>
                <span className={`font-medium tabular-nums ${q === 0 ? 'text-rose-600' : 'text-slate-800'}`}>{q}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-slate-500">
            Captured {age}s ago
            {stats?.useProxy && (cacheLeft > 0 ? ` · cached for ${cacheLeft}s more` : ' · cache expired')}
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-400">Loading stock…</div>
      )}

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); onRestock(warehouse.id, sku, Number(quantity)).then(() => setSku('')) }}>
        <input className={fieldCls + ' flex-1'} list="skus" placeholder="SKU to restock" value={sku} onChange={(e) => setSku(e.target.value)} required />
        <input className={fieldCls + ' w-20 shrink-0'} type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required aria-label="Quantity" />
        <button className={btnCls + ' shrink-0'} disabled={busy}>Restock</button>
      </form>
    </div>
  )
}
