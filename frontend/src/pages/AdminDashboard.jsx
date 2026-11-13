import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Overview from '../components/Overview'
import FAQManagement from '../components/FAQManagement'
import QueryLogs from '../components/QueryLogs'
import { clearToken, getAdminName } from '../utils/auth'

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'faqs', label: 'FAQ Management', icon: 'book' },
  { key: 'logs', label: 'Query Logs', icon: 'clock' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const navigate = useNavigate()
  const current = TABS.find((t) => t.key === tab)
  const name = getAdminName() || 'Administrator'

  function logout() {
    clearToken()
    navigate('/admin/login')
  }

  // Called by any child whose request came back 401 (expired session).
  function handleUnauthorized() {
    clearToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="side-brand">
          <span className="seal">IU</span>
          <span className="brand-text">
            <span className="brand-name">Invertis University</span>
            <span className="brand-sub">Helpdesk Admin</span>
          </span>
        </div>

        <nav className="side-nav" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`side-link${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? 'page' : undefined}
            >
              <Icon name={t.icon} size={17} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="side-foot">
          <div className="admin-user">
            <span className="admin-avatar">{name.charAt(0).toUpperCase()}</span>
            <div className="admin-id">
              <div className="admin-name" title={name}>{name}</div>
              <div className="admin-role">Administrator</div>
            </div>
          </div>
          <button type="button" className="side-logout" onClick={logout}>
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-top">
          <h1>{current.label}</h1>
          <Link to="/" className="top-link">
            View student helpdesk <Icon name="arrowRight" size={14} />
          </Link>
        </header>

        <div className="admin-content">
          {tab === 'overview' && <Overview onUnauthorized={handleUnauthorized} onNavigate={setTab} />}
          {tab === 'faqs' && <FAQManagement onUnauthorized={handleUnauthorized} />}
          {tab === 'logs' && <QueryLogs onUnauthorized={handleUnauthorized} />}
        </div>
      </div>
    </div>
  )
}
