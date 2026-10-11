import { useState } from 'react'
import { btnCls, cardCls, fieldCls, ghostCls, inputCls } from '../styles.js'

const CITIES = {
  Cairo: [30.0444, 31.2357],
  Giza: [30.0131, 31.2089],
  Alexandria: [31.2001, 29.9187],
  Mansoura: [31.0409, 31.3785],
  Luxor: [25.6872, 32.6396],
  Aswan: [24.0889, 32.8998],
  Hurghada: [27.2579, 33.8116],
}

export default function OrderForm({ onSearch, onOrder, busy }) {
  const [lines, setLines] = useState([
    { sku: 'LAPTOP-15', quantity: 2 },
    { sku: 'MONITOR-27', quantity: 1 },
  ])
  const [city, setCity] = useState('Cairo')

  const updateLine = (i, patch) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const removeLine = (i) => setLines(lines.filter((_, j) => j !== i))
  const addLine = () => setLines([...lines, { sku: '', quantity: 1 }])

  const order = () => {
    const [lat, lon] = CITIES[city]
    return {
      lines: lines.map((l) => ({ sku: l.sku, quantity: Number(l.quantity) })),
      destinationLatitude: lat,
      destinationLongitude: lon,
    }
  }

  const submit = (action) => (e) => {
    e.preventDefault()
    action(order())
  }

  return (
    <form className={cardCls} onSubmit={submit(onSearch)}>
      <h2 className="mb-3 font-semibold text-slate-800">Incoming order</h2>

      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <input className={fieldCls + ' flex-1'} list="skus" placeholder="SKU" value={line.sku}
              onChange={(e) => updateLine(i, { sku: e.target.value })} required />
            <input className={fieldCls + ' w-20 shrink-0'} type="number" min="1" value={line.quantity}
              onChange={(e) => updateLine(i, { quantity: e.target.value })} required aria-label="Quantity" />
            <button type="button" className={ghostCls + ' shrink-0'} onClick={() => removeLine(i)}
              disabled={lines.length === 1} aria-label="Remove line">✕</button>
          </div>
        ))}
      </div>
      <button type="button" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800" onClick={addLine}>
        + Add line
      </button>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Deliver to
        {/* appearance-none drops the native look (which ignores padding/border in Safari); the chevron replaces its arrow. */}
        <div className="relative mt-1">
          <select className={inputCls + ' appearance-none pr-10 font-normal text-slate-900'} value={city} onChange={(e) => setCity(e.target.value)}>
            {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button className={btnCls + ' flex-1'} disabled={busy}>Find warehouse</button>
        <button type="button" className={ghostCls + ' flex-1'} disabled={busy} onClick={submit(onOrder)}>Place order</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        “Find warehouse” only reads stock. Run it twice to see the proxy answer from its cache.
        “Place order” reserves the stock at the chosen warehouse.
      </p>
    </form>
  )
}
