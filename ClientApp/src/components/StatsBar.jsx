import { ghostCls } from '../styles.js'

function Stat({ label, value, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  )
}

export default function StatsBar({ stats, onReset, busy }) {
  if (!stats) return null
  const lookups = stats.cacheHits + stats.cacheMisses
  const ratio = lookups === 0 ? '–' : `${Math.round((stats.cacheHits / lookups) * 100)}%`

  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${stats.useProxy ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
          Caching proxy {stats.useProxy ? 'ON' : 'OFF'}
        </span>
        {stats.useProxy && <span className="text-sm text-slate-500">cache TTL {stats.cacheTtlSeconds}s</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Warehouse calls" value={stats.remoteCalls} tone="text-amber-700" />
        <Stat label="Cache hits" value={stats.cacheHits} tone="text-emerald-700" />
        <Stat label="Cache misses" value={stats.cacheMisses} />
        <Stat label="Hit ratio" value={ratio} />
        <button className={ghostCls + ' col-span-2 sm:col-span-1'} disabled={busy} onClick={onReset}>Reset counters</button>
      </div>
    </section>
  )
}
