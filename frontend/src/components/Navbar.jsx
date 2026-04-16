import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="topbar">
      <div>
        <div className="brand">PulseTrack</div>
        <div className="brand-subtitle">
          Employee Performance & Development Platform
        </div>
      </div>

      <div className="topbar-right">
        <div className="user-chip">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role}</span>
        </div>
        <button className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}