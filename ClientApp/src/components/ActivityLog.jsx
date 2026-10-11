import { CACHE_FAST_MS, cardCls } from '../styles.js'

export default function ActivityLog({ entries }) {
  return (
    <section className={cardCls}>
      <h2 className="mb-2 font-semibold text-slate-800">Activity</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-slate-700">
                <span className="mr-2 text-xs text-slate-400">{e.time}</span>{e.label}
              </span>
              <span className={`tabular-nums ${e.error ? 'text-rose-600' : e.ms < CACHE_FAST_MS ? 'text-emerald-700' : 'text-amber-700'}`}>
                {e.error ?? `${e.ms} ms`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
