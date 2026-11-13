import api from './client'

export async function getStats() {
  const res = await api.get('/api/admin/stats')
  return res.data
}

export async function getQueries(limit = 50) {
  const res = await api.get('/api/admin/queries', { params: { limit } })
  return res.data
}
