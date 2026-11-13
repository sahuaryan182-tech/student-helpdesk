import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { login } from '../api/auth'
import { setToken, setAdminName, isLoggedIn } from '../utils/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Already signed in? Skip the form.
  if (isLoggedIn()) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await login(username.trim(), password)
      setToken(result.access_token)
      setAdminName(result.username || username.trim())
      navigate('/admin')
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Please check that the backend is running.')
      } else if (err.response.status === 401) {
        // The backend deliberately gives the same message for a wrong
        // username and a wrong password.
        setError('Invalid username or password.')
      } else {
        setError('Sign-in failed. Please check your details and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <aside className="login-aside">
        <div className="login-aside-inner">
          <div className="brand brand-light">
            <span className="seal">IU</span>
            <span className="brand-text">
              <span className="brand-name">Invertis University</span>
              <span className="brand-sub">Student Helpdesk</span>
            </span>
          </div>

          <h2>Helpdesk administration</h2>
          <p>Keep the knowledge base accurate and see how well the assistant is serving students.</p>

          <ul className="login-points">
            <li><Icon name="book" size={18} /> Add, edit and disable FAQ entries</li>
            <li><Icon name="grid" size={18} /> Track resolved and unresolved queries</li>
            <li><Icon name="clock" size={18} /> Review what students are asking</li>
          </ul>
        </div>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <Link to="/" className="back-link"><Icon name="arrowLeft" size={15} /> Back to student helpdesk</Link>
          <h1>Sign in</h1>
          <p className="login-sub">Authorised administrators only.</p>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />

          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="icon-btn input-adorn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'eyeoff' : 'eye'} size={17} />
            </button>
          </div>

          {error && (
            <div className="inline-error" role="alert">
              <Icon name="alert" size={16} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !username.trim() || !password}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  )
}
