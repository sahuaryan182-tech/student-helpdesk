import api from './client'

export async function listFaqs({ category, search } = {}) {
  const res = await api.get('/api/faqs', { params: { category, search } })
  return res.data
}

export async function createFaq(faq) {
  const res = await api.post('/api/faqs', faq)
  return res.data
}

export async function updateFaq(id, updates) {
  const res = await api.put(`/api/faqs/${id}`, updates)
  return res.data
}

export async function deleteFaq(id) {
  await api.delete(`/api/faqs/${id}`)
}
