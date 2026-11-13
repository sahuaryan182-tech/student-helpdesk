import { useEffect, useState } from 'react'
import Icon from './Icon'
import { getQueries } from '../api/admin'
import { formatDateTime } from '../utils/time'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'unresolved', label: 'Unresolved' },
]

export default function QueryLogs({ onUnauthorized }) {
  const [logs, setLogs] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    getQueries(100)
      .then((data) => {
        if (!cancelled) setLogs(data)
      })
      .catch((err) => {
        if (err.response?.status === 401) return onUnauthorized()
        if (!cancelled) setError('Could not load query logs.')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  const all = logs ?? []
  const counts = {
    all: all.length,
    resolved: all.filter((l) => l.resolved).length,
    unresolved: all.filter((l) => !l.resolved).length,
  }
  const visible = all.filter((l) => (filter === 'all' ? true : filter === 'resolved' ? l.resolved : !l.resolved))

  return (
    <div className="stack">
      <div className="banner banner-info">
        <Icon name="alert" size={16} />
        <span>
          <strong>Unresolved</strong> questions are things students asked that the knowledge base couldn't answer
          confidently. They're a good guide to which FAQs to add next.
        </span>
      </div>

      <section className="card">
        <div className="toolbar">
          <div className="segmented" role="tablist" aria-label="Filter queries">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={filter === f.key ? 'active' : ''}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="seg-count">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReloadKey((k) => k + 1)}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </div>

        {error ? (
          <div className="banner banner-error" role="alert" style={{ margin: 20 }}>
            <Icon name="alert" size={16} /> {error}
          </div>
        ) : !logs ? (
          <div className="skeleton" style={{ height: 220, margin: 20 }} />
        ) : visible.length === 0 ? (
          <div className="empty">
            <Icon name="inbox" size={30} />
            <h3>No queries to show</h3>
            <p>{filter === 'all' ? 'Queries will appear here as students use the chatbot.' : 'Nothing matches this filter.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 150 }}>Time</th>
                  <th>Question</th>
                  <th style={{ width: 130 }}>Category</th>
                  <th style={{ width: 150 }}>Match</th>
                  <th style={{ width: 170 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => (
                  <tr key={l.id}>
                    <td className="muted nowrap">{formatDateTime(l.createdAt)}</td>
                    <td>{l.question}</td>
                    <td>{l.category ? <span className="tag">{l.category}</span> : <span className="muted">—</span>}</td>
                    <td>
                      <span className="meter">
                        <span className="meter-bar"><span className="meter-fill" style={{ width: `${Math.round(l.confidence * 100)}%` }} /></span>
                        <span className="meter-label">{Math.round(l.confidence * 100)}%</span>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${l.resolved ? 'badge-ok' : 'badge-bad'}`}>
                        {l.resolved ? 'Resolved' : 'Unresolved'}
                      </span>
                      {l.source === 'ai' && <span className="badge badge-ai">AI</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
