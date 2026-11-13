import Icon from './Icon'

const SKELETON_COUNT = 4

export default function StatsCards({ stats }) {
  if (!stats) {
    return (
      <div className="stats-grid" aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="stat-card skeleton" style={{ height: 104 }} />
        ))}
      </div>
    )
  }

  const rate = stats.totalQueries ? Math.round((stats.resolvedQueries / stats.totalQueries) * 100) : null

  const cards = [
    { label: 'FAQ entries', value: stats.totalFaqs, icon: 'database', tone: 'navy', note: 'In the knowledge base' },
    { label: 'Total queries', value: stats.totalQueries, icon: 'message', tone: 'gold', note: 'Asked by students' },
    {
      label: 'Resolution rate',
      value: rate === null ? '—' : `${rate}%`,
      icon: 'check',
      tone: 'teal',
      note: `${stats.resolvedQueries} answered automatically`,
    },
    {
      label: 'Unresolved',
      value: stats.unresolvedQueries,
      icon: 'alert',
      tone: 'red',
      note: 'No confident match found',
    },
  ]

  return (
    <div className="stats-grid">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <span className={`stat-icon tone-${c.tone}`}><Icon name={c.icon} size={20} /></span>
          <div className="stat-body">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-note">{c.note}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
