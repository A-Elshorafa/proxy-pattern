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
        <select className={inputCls + ' mt-1'} value={city} onChange={(e) => setCity(e.target.value)}>
          {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
        </select>
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
