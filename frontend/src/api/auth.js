import api from './client'

export async function login(username, password) {
  const res = await api.post('/api/auth/login', { username, password })
  return res.data
}
