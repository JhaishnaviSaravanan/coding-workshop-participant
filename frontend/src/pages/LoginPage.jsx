import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/authService'
import { AuthContext } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorText, setErrorText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setErrorText('')

    try {
      const data = await loginUser(email, password)
      login(data)
      navigate('/dashboard')
    } catch (error) {
      setErrorText(error.message || 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="hero-badge">PulseTrack</div>
        <h1>Performance intelligence for modern teams.</h1>
        <p>
          Securely monitor employee performance, identify skill gaps, review team
          outcomes, and support workforce development through a unified enterprise
          platform.
        </p>
      </div>

      <div className="login-card">
        <h2>Sign in to PulseTrack</h2>
        <p className="login-muted">
          Use your corporate credentials to access your workspace.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorText ? <div className="error-text">{errorText}</div> : null}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}