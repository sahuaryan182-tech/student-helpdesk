import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import Modal from './Modal'
import Toast from './Toast'
import { listFaqs, createFaq, updateFaq, deleteFaq } from '../api/faqs'
import { getAiStatus, suggestKeywords } from '../api/ai'
import { TOPIC_CATEGORIES } from '../data/topics'

const EMPTY_FORM = { category: '', question: '', answer: '', keywords: '', active: true }

// The backend returns {"error": ..., "details": [...]} for validation errors
// and {"detail": "..."} for the rest; show the most specific message we have.
function apiMessage(err, fallback) {
  const data = err.response?.data
  if (data?.details?.length) return data.details[0]
  if (typeof data?.detail === 'string') return data.detail
  return fallback
}

export default function FAQManagement({ onUnauthorized }) {
  const [faqs, setFaqs] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [knownCategories, setKnownCategories] = useState(() => new Set(TOPIC_CATEGORIES))
  const [reloadKey, setReloadKey] = useState(0)

  const [modal, setModal] = useState(null) // { mode: 'create' | 'edit', id? }
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [suggesting, setSuggesting] = useState(false)

  const [deleting, setDeleting] = useState(null) // the FAQ pending deletion
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  function showToast(type, message) {
    setToast({ type, message })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Only offer the AI button when the server actually has AI switched on.
  useEffect(() => {
    getAiStatus().then((s) => setAiEnabled(Boolean(s.enabled))).catch(() => {})
  }, [])

  // Wait for the admin to stop typing before searching.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setError(null)
    listFaqs({ category: category || undefined, search: query || undefined })
      .then((data) => {
        if (cancelled) return
        setFaqs(data)
        setKnownCategories((prev) => {
          const next = new Set(prev)
          data.forEach((f) => next.add(f.category))
          return next
        })
      })
      .catch((err) => {
        if (err.response?.status === 401) return onUnauthorized()
        if (!cancelled) setError('Could not load FAQs.')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ mode: 'create' })
  }

  function openEdit(faq) {
    setForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords.join(', '),
      active: faq.active,
    })
    setFormError(null)
    setModal({ mode: 'edit', id: faq.id })
  }

  function closeModal() {
    if (saving) return
    setModal(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      category: form.category.trim(),
      question: form.question.trim(),
      answer: form.answer.trim(),
      keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      active: form.active,
    }
    if (!payload.category) return setFormError('Please choose or enter a category.')
    if (payload.question.length < 3) return setFormError('The question must be at least 3 characters.')
    if (!payload.answer) return setFormError('Please enter the answer students should see.')

    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'edit') {
        await updateFaq(modal.id, payload)
        showToast('success', 'FAQ updated')
      } else {
        await createFaq(payload)
        showToast('success', 'FAQ added')
      }
      setModal(null)
      reload()
    } catch (err) {
      if (err.response?.status === 401) return onUnauthorized()
      setFormError(apiMessage(err, 'Could not save the FAQ. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSuggest() {
    if (form.question.trim().length < 3 || !form.answer.trim()) {
      return setFormError('Fill in the question and answer first, then ask the AI to suggest keywords.')
    }
    setSuggesting(true)
    setFormError(null)
    try {
      const suggested = await suggestKeywords(form.question.trim(), form.answer.trim())
      const existing = form.keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean)
      setForm((f) => ({ ...f, keywords: [...new Set([...existing, ...suggested])].join(', ') }))
    } catch (err) {
      if (err.response?.status === 401) return onUnauthorized()
      setFormError(apiMessage(err, 'Could not get AI suggestions. Please try again.'))
    } finally {
      setSuggesting(false)
    }
  }

  async function toggleActive(faq) {
    const next = !faq.active
    setFaqs((list) => list.map((f) => (f.id === faq.id ? { ...f, active: next } : f)))
    try {
      await updateFaq(faq.id, { active: next })
      showToast('success', next ? 'FAQ enabled' : 'FAQ disabled')
    } catch (err) {
      setFaqs((list) => list.map((f) => (f.id === faq.id ? { ...f, active: faq.active } : f)))
      if (err.response?.status === 401) return onUnauthorized()
      showToast('error', 'Could not change the FAQ status')
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await deleteFaq(deleting.id)
      setDeleting(null)
      showToast('success', 'FAQ deleted')
      reload()
    } catch (err) {
      if (err.response?.status === 401) return onUnauthorized()
      setDeleting(null)
      showToast('error', 'Could not delete the FAQ')
    } finally {
      setDeleteBusy(false)
    }
  }

  const categoryOptions = [...knownCategories].sort()
  const filtering = Boolean(query || category)

  return (
    <div className="stack">
      <section className="card">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <Icon name="search" size={16} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions and keywords…"
                aria-label="Search FAQs"
              />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Icon name="plus" size={16} /> Add FAQ
          </button>
        </div>

        {error ? (
          <div className="banner banner-error" role="alert" style={{ margin: 20 }}>
            <Icon name="alert" size={16} /> {error}
            <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Retry</button>
          </div>
        ) : !faqs ? (
          <div className="skeleton" style={{ height: 260, margin: 20 }} />
        ) : faqs.length === 0 ? (
          <div className="empty">
            <Icon name="inbox" size={30} />
            <h3>{filtering ? 'No FAQs match your search' : 'No FAQs yet'}</h3>
            <p>{filtering ? 'Try a different keyword or category.' : 'Add your first FAQ so the chatbot has answers to give.'}</p>
            {!filtering && (
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                <Icon name="plus" size={16} /> Add FAQ
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 130 }}>Category</th>
                    <th>Question &amp; answer</th>
                    <th style={{ width: 220 }}>Keywords</th>
                    <th style={{ width: 90 }}>Active</th>
                    <th style={{ width: 96 }} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((f) => (
                    <tr key={f.id} className={f.active ? '' : 'row-off'}>
                      <td><span className="tag">{f.category}</span></td>
                      <td>
                        <div className="faq-q">{f.question}</div>
                        <div className="faq-a">{f.answer}</div>
                      </td>
                      <td>
                        <div className="chips-sm">
                          {f.keywords.slice(0, 4).map((k) => (
                            <span key={k} className="chip-sm">{k}</span>
                          ))}
                          {f.keywords.length > 4 && <span className="chip-sm more">+{f.keywords.length - 4}</span>}
                          {f.keywords.length === 0 && <span className="muted">—</span>}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={f.active}
                          aria-label={`${f.active ? 'Disable' : 'Enable'} FAQ: ${f.question}`}
                          className={`switch${f.active ? ' on' : ''}`}
                          onClick={() => toggleActive(f)}
                        >
                          <span />
                        </button>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-btn" onClick={() => openEdit(f)} aria-label="Edit FAQ">
                            <Icon name="edit" size={16} />
                          </button>
                          <button type="button" className="icon-btn danger" onClick={() => setDeleting(f)} aria-label="Delete FAQ">
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-foot">Showing {faqs.length} {faqs.length === 1 ? 'FAQ' : 'FAQs'}</div>
          </>
        )}
      </section>

      {modal && (
        <Modal
          title={modal.mode === 'edit' ? 'Edit FAQ' : 'Add FAQ'}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button type="submit" form="faq-form" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : modal.mode === 'edit' ? 'Save changes' : 'Add FAQ'}
              </button>
            </>
          }
        >
          <form id="faq-form" className="form" onSubmit={handleSave} noValidate>
            <div className="field">
              <label htmlFor="f-category">Category</label>
              <input
                id="f-category"
                list="category-options"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Fees"
                maxLength={50}
              />
              <datalist id="category-options">
                {categoryOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="field">
              <label htmlFor="f-question">Question</label>
              <input
                id="f-question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="How can I pay semester fees?"
              />
            </div>

            <div className="field">
              <label htmlFor="f-answer">Answer</label>
              <textarea
                id="f-answer"
                rows={4}
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="The answer students will see."
              />
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="f-keywords">Keywords</label>
                {aiEnabled && (
                  <button type="button" className="btn-ai" onClick={handleSuggest} disabled={suggesting}>
                    <Icon name="sparkle" size={13} /> {suggesting ? 'Thinking…' : 'Suggest with AI'}
                  </button>
                )}
              </div>
              <input
                id="f-keywords"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="fees, payment, semester"
              />
              <span className="help">Comma-separated. Include words students are likely to use — the matcher compares their question against these.</span>
            </div>

            <label className="check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span>Active — the chatbot can use this FAQ to answer students</span>
            </label>

            {formError && (
              <div className="inline-error" role="alert"><Icon name="alert" size={16} /> {formError}</div>
            )}
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Delete this FAQ?"
          size="sm"
          onClose={() => !deleteBusy && setDeleting(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </>
          }
        >
          <p className="confirm-text">
            “{deleting.question}” will be removed and students will no longer receive this answer. This can't be undone.
            To keep it but stop using it, switch it off instead.
          </p>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  )
}
