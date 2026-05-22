// Client-side helper for all write operations.
// Routes through /api/admin which uses the service role key server-side.

async function adminCall(action: string, table: string, data?: object, id?: string) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, table, data, id }),
  })
  const json = await res.json()
  if (!res.ok) return { data: null, error: { message: json.error || 'Request failed' } }
  return { data: json.data, error: null }
}

export const db = {
  insert: (table: string, data: object) => adminCall('insert', table, data),
  update: (table: string, id: string, data: object) => adminCall('update', table, data, id),
  delete: (table: string, id: string) => adminCall('delete', table, undefined, id),
}
