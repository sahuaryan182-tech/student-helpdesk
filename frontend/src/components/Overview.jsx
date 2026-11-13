import { useEffect, useState } from 'react'
import Icon from './Icon'
import StatsCards from './StatsCards'
import { getStats, getQueries } from '../api/admin'
import { getAiStatus } from '../api/ai'
import { formatDateTime } from '../utils/time'

export default function Overview({ onUnauthorized, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [ai, setAi] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all([getStats(), getQueries(6), getAiStatus().catch(() => null)])
      .then(([s, q, a]) => {
        if (cancelled) return
        setStats(s)
        setRecent(q)
        setAi(a)
      })
      .catch((err) => {
        if (err.response?.status === 401) return onUnauthorized()
        if (!cancelled) setError('Could not load dashboard data.')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  const categories = stats?.topCategories ?? []
  const maxCount = categories.reduce((m, c) => Math.max(m, c.count), 0)

  return (
    <div className="stack">
      {error && (
        <div className="banner banner-error" role="alert">
          <Icon name="alert" size={16} /> {error}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
        </div>
      )}

      <StatsCards stats={stats} />

      {ai && (
        <div className={`ai-card ${ai.enabled ? 'on' : 'off'}`}>
          <span className="ai-card-icon"><Icon name="sparkle" size={20} /></span>
          <div className="ai-card-body">
            <div className="ai-card-title">
              AI assistant: {ai.enabled ? 'On' : 'Off'}
              {ai.enabled && ai.model && <span className="ai-model">{ai.model}</span>}
            </div>
            <div className="ai-card-text">
              {ai.enabled
                ? `Used only when the FAQ matcher has no confident match, and it may answer only from your FAQ entries. ${ai.aiAnswered} AI-assisted ${ai.aiAnswered === 1 ? 'answer' : 'answers'} so far.`
                : 'Students are answered by the FAQ matcher only. To switch on the AI fallback, set AI_ENABLED and AI_API_KEY in backend/.env (see AI_SETUP.md).'}
            </div>
            {ai.lastError && (
              <div className="ai-card-error"><Icon name="alert" size={14} /> Last AI error: {ai.lastError}</div>
            )}
          </div>
        </div>
      )}

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h2>Most-asked categories</h2>
          </div>
          <div className="card-body">
            {!stats ? (
              <div className="skeleton" style={{ height: 150 }} />
            ) : categories.length === 0 ? (
              <div className="empty-sm">
                <Icon name="inbox" size={22} />
                <p>No answered queries yet. Categories appear here once students start chatting.</p>
              </div>
            ) : (
              <ul className="bars">
                {categories.map((c) => (
                  <li key={c.category}>
                    <div className="bar-row">
                      <span className="bar-label">{c.category}</span>
                      <span className="bar-count">{c.count}</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(c.count / maxCount) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Recent queries</h2>
            <button type="button" className="link-btn" onClick={() => onNavigate('logs')}>
              View all <Icon name="arrowRight" size={14} />
            </button>
          </div>
          <div className="card-body flush">
            {!recent ? (
              <div className="skeleton" style={{ height: 150, margin: 20 }} />
            ) : recent.length === 0 ? (
              <div className="empty-sm">
                <Icon name="inbox" size={22} />
                <p>No queries yet.</p>
              </div>
            ) : (
              <ul className="recent-list">
                {recent.map((q) => (
                  <li key={q.id}>
                    <div className="recent-main">
                      <span className="recent-q">{q.question}</span>
                      <span className="recent-time">{formatDateTime(q.createdAt)}</span>
                    </div>
                    <span className={`badge ${q.resolved ? 'badge-ok' : 'badge-bad'}`}>
                      {q.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
