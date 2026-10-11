async function request(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const text = await res.text()
  let body = text
  try { body = text ? JSON.parse(text) : null } catch { /* plain-text error */ }
  if (!res.ok) {
    const error = new Error(typeof body === 'string' ? body : `Request failed (${res.status})`)
    error.status = res.status
    error.body = body
    throw error
  }
  return body
}

const post = (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })

export const listWarehouses = () => request('/api/warehouses')
export const getStock = (id) => request(`/api/warehouses/${id}/stock`)
export const restock = (id, sku, quantity) => post(`/api/warehouses/${id}/restock`, { sku, quantity })
export const searchFulfillment = (order) => post('/api/fulfillment/search', order)
export const getStats = () => request('/api/proxy/stats')
export const resetStats = () => request('/api/proxy/stats', { method: 'DELETE' })

// 409 means no warehouse could take the order. The body still lists every candidate, so return it.
export const placeOrder = (order) =>
  post('/api/fulfillment/orders', order).catch((err) => {
    if (err.status === 409) return err.body
    throw err
  })
