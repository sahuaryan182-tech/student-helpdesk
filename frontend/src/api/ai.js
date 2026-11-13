import api from './client'

export async function getAiStatus() {
  const res = await api.get('/api/ai/status')
  return res.data // { enabled, provider, model, lastError, aiAnswered }
}

export async function suggestKeywords(question, answer) {
  const res = await api.post('/api/ai/suggest-keywords', { question, answer })
  return res.data.keywords
}
