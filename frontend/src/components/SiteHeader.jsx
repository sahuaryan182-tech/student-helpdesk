import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="brand" aria-label="Invertis Student Helpdesk home">
          <span className="seal">IU</span>
          <span className="brand-text">
            <span className="brand-name">Invertis University</span>
            <span className="brand-sub">Student Helpdesk</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link to="/admin/login" className="nav-btn">
            <Icon name="shield" size={15} />
            Admin login
          </Link>
        </nav>
      </div>
    </header>
  )
}
