import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function PageShell({ title, subtitle, children }) {
  const { user } = useContext(AuthContext)

  return (
    <div className="dashboard-shell">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar role={user?.role} />

        <main className="dashboard-content">
          <div className="hero-panel">
            <div>
              <div className="hero-label">PulseTrack Workspace</div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}