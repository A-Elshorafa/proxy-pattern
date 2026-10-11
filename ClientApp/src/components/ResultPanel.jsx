import { CACHE_FAST_MS, cardCls, secondsSince } from '../styles.js'

function CandidateRow({ candidate, rank, chosen, now }) {
  return (
    <li className={`rounded-lg p-3 ring-1 ${chosen ? 'bg-indigo-50 ring-indigo-300' : 'bg-slate-50 ring-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="mr-2 text-xs text-slate-400">#{rank}</span>
          <span className="font-medium text-slate-800">{candidate.name}</span>
          <span className="ml-2 text-sm text-slate-500">{candidate.city} · {candidate.distanceKm} km</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          chosen ? 'bg-indigo-600 text-white' : candidate.canFulfill ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {chosen ? 'Chosen' : candidate.canFulfill ? 'Can fulfill' : 'Missing items'}
        </span>
      </div>
      {candidate.missing.length > 0 && (
        <ul className="mt-1 text-sm text-rose-700">{candidate.missing.map((m) => <li key={m}>• {m}</li>)}</ul>
      )}
      <div className="mt-1 text-xs text-slate-500">Stock captured {secondsSince(candidate.stockCapturedAt, now)}s ago</div>
    </li>
  )
}

export default function ResultPanel({ result, now }) {
  if (!result) {
    return (
      <section className={cardCls + ' flex items-center justify-center text-sm text-slate-500'}>
        Submit an order to see which warehouse can fulfill it.
      </section>
    )
  }

  const { kind, data } = result
  const chosen = kind === 'search' ? data.selected : data.reservedAt
  const fast = data.elapsedMs < CACHE_FAST_MS

  const title =
    kind === 'search'
      ? chosen ? 'Best warehouse found' : 'No single warehouse can fulfill this order'
      : chosen ? 'Order reserved' : 'Order could not be placed'

  return (
    <section className={cardCls}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={`font-semibold ${chosen ? 'text-slate-800' : 'text-rose-700'}`}>{title}</h2>
          {kind === 'order' && data.reservationId && (
            <div className="text-xs text-slate-500">Reservation {data.reservationId}</div>
          )}
        </div>
        <span className={`self-start rounded-full px-3 py-1 text-xs font-medium ${fast ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
          {Math.round(data.elapsedMs)} ms · {fast ? 'served from proxy cache' : 'warehouse systems called'}
        </span>
      </div>

      {kind === 'order' && data.skipped.length > 0 && (
        <div className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <div className="font-medium">Skipped (cached stock was out of date):</div>
          <ul>{data.skipped.map((s) => <li key={s}>• {s}</li>)}</ul>
        </div>
      )}

      <ol className="space-y-2">
        {data.candidates.map((c, i) => (
          <CandidateRow key={c.warehouseId} candidate={c} rank={i + 1} chosen={chosen?.warehouseId === c.warehouseId} now={now} />
        ))}
      </ol>
    </section>
  )
}
