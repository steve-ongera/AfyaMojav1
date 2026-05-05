import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// ── Role-based nav config ─────────────────────────────────────
const NAV_CONFIG = {
  // Shared by ALL roles
  common: [
    { label: 'Dashboard', icon: 'bi-grid-1x2', path: '/dashboard' },
  ],

  doctor: [
    { section: 'Clinical' },
    { label: 'My Patients',     icon: 'bi-person-heart',      path: '/patients' },
    { label: 'Visits Queue',    icon: 'bi-list-check',        path: '/visits', badge: 3 },
    { label: 'Medical Records', icon: 'bi-file-earmark-text', path: '/records' },
    { label: 'Prescriptions',   icon: 'bi-capsule',           path: '/prescriptions' },
    { section: 'Requests' },
    { label: 'Radiology Req.',  icon: 'bi-lungs',             path: '/radiology-requests' },
    { label: 'Lab Requests',    icon: 'bi-droplet-half',      path: '/lab-requests' },
  ],

  nurse: [
    { section: 'Nursing' },
    { label: 'Triage',          icon: 'bi-heart-pulse',       path: '/triage', badge: 2 },
    { label: 'Patient List',    icon: 'bi-people',            path: '/patients' },
    { label: 'Vitals',          icon: 'bi-activity',          path: '/vitals' },
    { label: 'Nursing Notes',   icon: 'bi-journal-text',      path: '/nursing-notes' },
  ],

  receptionist: [
    { section: 'Reception' },
    { label: 'Register Patient', icon: 'bi-person-plus',     path: '/register-patient' },
    { label: 'All Patients',     icon: 'bi-people',          path: '/patients' },
    { label: 'New Visit',        icon: 'bi-calendar-plus',   path: '/new-visit' },
    { label: 'Appointments',     icon: 'bi-calendar3',       path: '/appointments' },
    { label: 'Visit List',       icon: 'bi-list-ul',         path: '/visits' },
  ],

  radiologist: [
    { section: 'Radiology' },
    { label: 'Request Queue',   icon: 'bi-inbox',             path: '/radiology-queue', badge: 4 },
    { label: 'Upload Results',  icon: 'bi-cloud-upload',      path: '/radiology-upload' },
    { label: 'Reports',         icon: 'bi-file-earmark-image',path: '/radiology-reports' },
    { label: 'Patient List',    icon: 'bi-people',            path: '/patients' },
  ],

  pharmacist: [
    { section: 'Pharmacy' },
    { label: 'Prescription Queue', icon: 'bi-clipboard2-pulse', path: '/prescriptions', badge: 5 },
    { label: 'Dispense Medicine',  icon: 'bi-bag-check',        path: '/dispense' },
    { label: 'Medicine Stock',     icon: 'bi-box-seam',         path: '/medicines' },
    { label: 'Low Stock Alert',    icon: 'bi-exclamation-triangle', path: '/low-stock', badge: 2 },
  ],

  cashier: [
    { section: 'Billing' },
    { label: 'Billing Queue',   icon: 'bi-cash-stack',        path: '/billing', badge: 3 },
    { label: 'SHA / Insurance', icon: 'bi-shield-check',      path: '/sha-records' },
    { label: 'Invoices',        icon: 'bi-receipt',           path: '/invoices' },
    { label: 'Payments',        icon: 'bi-credit-card',       path: '/payments' },
    { label: 'Reports',         icon: 'bi-bar-chart-line',    path: '/financial-reports' },
  ],

  admin: [
    { section: 'Administration' },
    { label: 'All Patients',    icon: 'bi-people',            path: '/patients' },
    { label: 'All Visits',      icon: 'bi-list-ul',           path: '/visits' },
    { label: 'Staff Users',     icon: 'bi-person-gear',       path: '/users' },
    { label: 'Medicines',       icon: 'bi-capsule',           path: '/medicines' },
    { label: 'SHA Records',     icon: 'bi-shield-check',      path: '/sha-records' },
    { section: 'System' },
    { label: 'Audit Logs',      icon: 'bi-clock-history',     path: '/audit-logs' },
    { label: 'Settings',        icon: 'bi-gear',              path: '/settings' },
  ],
}

const ROLE_LABELS = {
  doctor:       'Doctor',
  nurse:        'Nurse',
  receptionist: 'Receptionist',
  radiologist:  'Radiologist',
  pharmacist:   'Pharmacist',
  cashier:      'Cashier',
  admin:        'Administrator',
}

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const role      = localStorage.getItem('role') || 'receptionist'
  const fullName  = localStorage.getItem('full_name') || 'Staff User'
  const initials  = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const roleNav   = NAV_CONFIG[role] || []
  const allNav    = [...NAV_CONFIG.common, ...roleNav]

  const handleNav = (path) => navigate(path)
  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  return (
    <aside className="afya-sidebar">

      {/* Brand */}
      <div className="afya-sidebar-brand">
        <div className="d-flex align-items-center gap-2">
          <div className="brand-logo">🏥</div>
          <div className="brand-text">
            <h6>AfyaMoja</h6>
            <small>HMIS v1.0</small>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        {allNav.map((item, idx) => {
          // Section label
          if (item.section) {
            return (
              <div key={idx} className="afya-sidebar-section-label">
                {item.section}
              </div>
            )
          }

          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

          return (
            <button
              key={idx}
              className={`afya-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
              {item.badge && (
                <span className="badge-count">{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer — user chip + logout */}
      <div className="afya-sidebar-footer">
        <div className="afya-user-chip">
          <div className="afya-user-avatar">{initials}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name text-truncate">{fullName}</div>
            <div className="user-role">{ROLE_LABELS[role] || role}</div>
          </div>
          <button
            className="afya-icon-btn"
            title="Sign Out"
            onClick={handleLogout}
            style={{ flexShrink: 0 }}
          >
            <i className="bi bi-box-arrow-right" style={{ color: '#64748b' }}></i>
          </button>
        </div>
      </div>
    </aside>
  )
}