// No width here, so callers can size the field. inputCls is the usual full-width version.
export const fieldCls =
  'min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
export const inputCls = fieldCls + ' w-full'
export const btnCls =
  'rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50'
export const ghostCls =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
export const cardCls = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200'

export const secondsSince = (iso, now) => Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))

// Under this, the server answered from the proxy's cache without calling any warehouse system.
export const CACHE_FAST_MS = 50
