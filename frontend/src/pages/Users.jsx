import React, { useEffect, useState, useCallback } from 'react'
import { userAPI, getErrorMessage } from '../utils/api'

const ROLES = ['doctor','nurse','receptionist','radiologist','pharmacist','cashier','admin']
const ROLE_LABELS = {
  doctor:'Doctor', nurse:'Nurse', receptionist:'Receptionist',
  radiologist:'Radiologist', pharmacist:'Pharmacist', cashier:'Cashier', admin:'Administrator',
}
const ROLE_COLORS = {
  doctor:'blue', nurse:'teal', receptionist:'gray',
  radiologist:'purple', pharmacist:'green', cashier:'yellow', admin:'red',
}

const EMPTY_FORM = {
  username:'', email:'', first_name:'', last_name:'',
  role:'receptionist', phone:'', password:'', password2:'',
}

export default function Users() {
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [roleFilter,setRoleFilter]= useState('')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await userAPI.list()
      let all = data?.results || data || []
      if (search)     all = all.filter(u =>
        `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      )
      if (roleFilter) all = all.filter(u => u.role === roleFilter)
      setUsers(all)
    } catch (e) { setError(getErrorMessage(e)) }
    finally     { setLoading(false) }
  }, [search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== form.password2) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true); setError('')
    try {
      await userAPI.create(form)
      setSuccess(`User ${form.first_name} ${form.last_name} created successfully.`)
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchUsers()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) { setError(getErrorMessage(e)) }
    finally     { setSaving(false) }
  }

  const handleToggleActive = async (user) => {
    try {
      await userAPI.update(user.id, { is_active: !user.is_active })
      fetchUsers()
    } catch (e) { alert(getErrorMessage(e)) }
  }

  // Group by role for summary
  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length
    return acc
  }, {})

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-person-gear me-2 text-primary"></i>Staff Users</h4>
          <p>Manage system users and role assignments</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true) }}>
          <i className="bi bi-person-plus"></i> Add Staff User
        </button>
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}

      {/* Role summary pills */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          className={`btn btn-sm ${roleFilter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
          style={{ borderRadius: 20 }}
          onClick={() => setRoleFilter('')}
        >
          All ({users.length})
        </button>
        {ROLES.map(r => roleCounts[r] > 0 && (
          <button key={r}
            className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 20 }}
            onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
          >
            {ROLE_LABELS[r]} ({roleCounts[r]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-5">
          <div className="afya-input-icon">
            <i className="bi bi-search"></i>
            <input className="afya-form-control" placeholder="Search by name, username or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Users grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : users.length === 0 ? (
        <div className="afya-card text-center py-5">
          <i className="bi bi-people" style={{ fontSize: 40, color: 'var(--afya-text-muted)' }}></i>
          <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>No staff users found.</p>
        </div>
      ) : (
        <div className="row g-3">
          {users.map(user => (
            <div className="col-12 col-md-6 col-lg-4" key={user.id}>
              <div className="afya-card h-100" style={{
                opacity: user.is_active ? 1 : 0.6,
                borderLeft: `4px solid var(--afya-${ROLE_COLORS[user.role] === 'blue' ? 'primary' : ROLE_COLORS[user.role] === 'green' ? 'green' : ROLE_COLORS[user.role] === 'red' ? 'red' : ROLE_COLORS[user.role] === 'yellow' ? 'yellow' : '#64748b'})`
              }}>
                <div className="d-flex align-items-start gap-3">
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: '#dbeafe', color: '#1d4ed8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 16
                  }}>
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }} className="text-truncate">
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--afya-text-muted)' }} className="text-truncate">
                      @{user.username}
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className={`afya-badge ${ROLE_COLORS[user.role] || 'gray'}`} style={{ fontSize: 11 }}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                      <span className={`afya-badge ${user.is_active ? 'green' : 'red'}`} style={{ fontSize: 10 }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--afya-text-muted)' }}>
                  {user.email && (
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <i className="bi bi-envelope"></i>
                      <span className="text-truncate">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="d-flex align-items-center gap-1">
                      <i className="bi bi-phone"></i>
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 mt-3">
                  <button
                    className={`btn btn-sm flex-fill ${user.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                    style={{ fontSize: 12, borderRadius: 8 }}
                    onClick={() => handleToggleActive(user)}
                  >
                    <i className={`bi ${user.is_active ? 'bi-slash-circle' : 'bi-check-circle'} me-1`}></i>
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    style={{ fontSize: 12, borderRadius: 8 }}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus text-primary me-2"></i>Add Staff User
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <form id="user-form" onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>First Name *</label>
                      <input name="first_name" className="afya-form-control" required
                        value={form.first_name} onChange={handleChange} placeholder="e.g. Amina" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Last Name *</label>
                      <input name="last_name" className="afya-form-control" required
                        value={form.last_name} onChange={handleChange} placeholder="e.g. Odhiambo" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Username *</label>
                      <input name="username" className="afya-form-control" required
                        value={form.username} onChange={handleChange} placeholder="e.g. dr.amina" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Email</label>
                      <input name="email" type="email" className="afya-form-control"
                        value={form.email} onChange={handleChange} placeholder="work email" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Role *</label>
                      <select name="role" className="afya-form-control" value={form.role} onChange={handleChange}>
                        {ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Phone</label>
                      <input name="phone" className="afya-form-control"
                        value={form.phone} onChange={handleChange} placeholder="0712345678" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Password *</label>
                      <input name="password" type="password" className="afya-form-control" required minLength={8}
                        value={form.password} onChange={handleChange} placeholder="Min 8 characters" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Confirm Password *</label>
                      <input name="password2" type="password" className="afya-form-control" required
                        value={form.password2} onChange={handleChange} placeholder="Repeat password" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="user-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm"></span> Creating...</>
                    : <><i className="bi bi-check-lg"></i> Create User</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}