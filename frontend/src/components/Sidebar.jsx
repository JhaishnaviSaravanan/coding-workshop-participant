import { NavLink } from 'react-router-dom'

export default function Sidebar({ role }) {
  function getLinkClass({ isActive }) {
    return isActive ? 'sidebar-link active' : 'sidebar-link'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">Navigation</div>

        <NavLink to="/dashboard" className={getLinkClass}>
          Dashboard
        </NavLink>

        {role === 'admin' && (
          <NavLink to="/admin" className={getLinkClass}>
            Admin Controls
          </NavLink>
        )}

        {(role === 'admin' || role === 'hr') && (
          <NavLink to="/insights" className={getLinkClass}>
            Organization Insights
          </NavLink>
        )}

        {role === 'manager' && (
          <NavLink to="/reviews" className={getLinkClass}>
            Team Reviews
          </NavLink>
        )}

        {role === 'employee' && (
          <NavLink to="/progress" className={getLinkClass}>
            My Progress
          </NavLink>
        )}
      </div>
    </aside>
  )
}