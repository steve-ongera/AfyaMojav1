import React from 'react'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS = {
  doctor:       'Doctor',
  nurse:        'Nurse',
  receptionist: 'Receptionist',
  radiologist:  'Radiologist',
  pharmacist:   'Pharmacist',
  cashier:      'Cashier',
  admin:        'Administrator',
}

export default function Navbar() {
  const navigate  = useNavigate()
  const fullName  = localStorage.getItem('full_name')  || 'User'
  const role      = localStorage.getItem('role')       || ''
  const initials  = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const pageTitles = {
    '/':          'Dashboard',
    '/dashboard': 'Dashboard',
  }
  const pageTitle = pageTitles[window.location.pathname] || 'AfyaMojav1'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <nav className="afya-navbar">
      {/* Left — page title */}
      <div>
        <div className="page-title">{pageTitle}</div>
        <div className="breadcrumb-text">
          AfyaMoja HMIS &rsaquo; {pageTitle}
        </div>
      </div>

      {/* Right — actions + user */}
      <div className="afya-navbar-right">

        {/* Notifications */}
        <button className="afya-icon-btn" title="Notifications">
          <i className="bi bi-bell fs-5"></i>
          <span className="notif-dot"></span>
        </button>

        {/* Search */}
        <button className="afya-icon-btn" title="Search">
          <i className="bi bi-search fs-5"></i>
        </button>

        {/* User dropdown (Bootstrap) */}
        <div className="dropdown">
          <button
            className="afya-icon-btn d-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            style={{ width: 'auto', padding: '4px 10px', borderRadius: 10 }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--afya-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 12
              }}
            >
              {initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--afya-text)', lineHeight: 1.2 }}>
                {fullName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--afya-text-muted)' }}>
                {ROLE_LABELS[role] || role}
              </div>
            </div>
            <i className="bi bi-chevron-down" style={{ fontSize: 11, color: 'var(--afya-text-muted)' }}></i>
          </button>

          <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: 12, minWidth: 190 }}>
            <li>
              <div className="px-3 py-2">
                <div style={{ fontSize: 13, fontWeight: 600 }}>{fullName}</div>
                <div style={{ fontSize: 11, color: 'var(--afya-text-muted)' }}>{ROLE_LABELS[role]}</div>
              </div>
            </li>
            <li><hr className="dropdown-divider my-1" /></li>
            <li>
              <button className="dropdown-item d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                <i className="bi bi-person"></i> My Profile
              </button>
            </li>
            <li>
              <button className="dropdown-item d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                <i className="bi bi-gear"></i> Settings
              </button>
            </li>
            <li><hr className="dropdown-divider my-1" /></li>
            <li>
              <button
                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                style={{ fontSize: 13 }}
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i> Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}