import api from './client'

export async function sendMessage(sessionId, question) {
  const res = await api.post('/api/chat', { sessionId, question })
  return res.data
}

export async function getHistory(sessionId) {
  const res = await api.get('/api/chat/history', { params: { sessionId } })
  return res.data
}
