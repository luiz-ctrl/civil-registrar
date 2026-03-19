import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import './AdminLayout.css'

const NAV = [
  { group: 'Main', items: [
    { to: '/admin/dashboard',     icon: 'bi-speedometer2',       label: 'Dashboard' },
    { to: '/admin/transactions',  icon: 'bi-clipboard-check',    label: 'Transactions' },
  ]},
  { group: 'Manage', items: [
    { to: '/admin/services',      icon: 'bi-grid-3x3-gap',       label: 'Services' },
    { to: '/admin/achievements',  icon: 'bi-award',              label: 'Achievements' },
    { to: '/admin/announcements', icon: 'bi-megaphone',          label: 'Announcements' },
  ]},
  { group: 'Analytics', items: [
    { to: '/admin/reports',       icon: 'bi-bar-chart-line',     label: 'Reports' },
  ]},
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [open, setOpen]  = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <a className="sidebar-brand" href="/">
          <div className="sidebar-brand-icon">CR</div>
          <div>
            <div className="sidebar-brand-text">Civil Registrar</div>
            <div className="sidebar-brand-sub">Admin Portal</div>
          </div>
        </a>

        <nav className="sidebar-nav">
          {NAV.map(group => (
            <div key={group.group}>
              <div className="sidebar-label">{group.group}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <i className={`bi ${item.icon}`}></i>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div className="sidebar-username">{user?.username}</div>
              <div className="sidebar-role">Administrator</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <div className="topbar">
          <button className="sidebar-toggle" onClick={() => setOpen(o => !o)}>
            <i className="bi bi-list"></i>
          </button>
          <div className="topbar-date">
            {new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
