import React, { useEffect, useState, useCallback } from 'react'
import { visitAPI, patientAPI, userAPI, getErrorMessage } from '../utils/api'

const STATUS_BADGE = {
  registered:  { cls: 'blue',   label: 'Registered' },
  triage:      { cls: 'yellow', label: 'Triage' },
  waiting:     { cls: 'yellow', label: 'Waiting' },
  with_doctor: { cls: 'blue',   label: 'With Doctor' },
  radiology:   { cls: 'purple', label: 'Radiology' },
  pharmacy:    { cls: 'teal',   label: 'Pharmacy' },
  billing:     { cls: 'yellow', label: 'Billing' },
  completed:   { cls: 'green',  label: 'Completed' },
  cancelled:   { cls: 'red',    label: 'Cancelled' },
}

const VISIT_TYPES = ['OPD','IPD','EMERGENCY','FOLLOWUP']
const STATUSES    = ['registered','triage','waiting','with_doctor','radiology','pharmacy','billing','completed','cancelled']

const EMPTY_FORM = { patient: '', visit_type: 'OPD', attending_doctor: '', notes: '' }

export default function Visits() {
  const role = localStorage.getItem('role')

  const [visits,    setVisits]    = useState([])
  const [patients,  setPatients]  = useState([])
  const [doctors,   setDoctors]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState({ status: '', today: 'true' })
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  const fetchVisits = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.status) params.status = filter.status
      if (filter.today)  params.today  = filter.today
      const { data } = await visitAPI.list(params)
      setVisits(data?.results || data || [])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchVisits() }, [fetchVisits])

  useEffect(() => {
    patientAPI.list().then(r => setPatients(r.data?.results || r.data || []))
    userAPI.list().then(r => {
      const all = r.data?.results || r.data || []
      setDoctors(all.filter(u => u.role === 'doctor'))
    })
  }, [])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        registered_by: localStorage.getItem('user_id'),
      }
      await visitAPI.create(payload)
      setSuccess('Visit created successfully.')
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchVisits()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (visitId, newStatus) => {
    try {
      await visitAPI.updateStatus(visitId, newStatus)
      fetchVisits()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-list-check me-2 text-primary"></i>Visits</h4>
          <p>Track patient visits through the care workflow</p>
        </div>
        {['receptionist','admin'].includes(role) && (
          <button className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true) }}>
            <i className="bi bi-calendar-plus"></i> New Visit
          </button>
        )}
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}

      {/* Filters */}
      <div className="afya-card mb-3">
        <div className="row g-3 align-items-center">
          <div className="col-auto">
            <label style={{ fontSize: 12, fontWeight: 600 }}>Status</label>
            <select className="afya-form-control mt-1"
              value={filter.status}
              onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_BADGE[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <label style={{ fontSize: 12, fontWeight: 600 }}>Period</label>
            <select className="afya-form-control mt-1"
              value={filter.today}
              onChange={e => setFilter(p => ({ ...p, today: e.target.value }))}>
              <option value="true">Today</option>
              <option value="">All Time</option>
            </select>
          </div>
          <div className="col-auto ms-auto d-flex align-items-end" style={{ marginTop: 20 }}>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchVisits}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {Object.entries(STATUS_BADGE).map(([key, val]) => {
          const count = visits.filter(v => v.status === key).length
          if (!count) return null
          return (
            <span key={key} className={`afya-badge ${val.cls}`}>
              {val.label} <strong>{count}</strong>
            </span>
          )
        })}
      </div>

      {/* Visits table */}
      <div className="afya-card p-0">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : visits.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x" style={{ fontSize: 40, color: 'var(--afya-text-muted)' }}></i>
            <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>No visits found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="afya-table">
              <thead>
                <tr>
                  <th>Visit #</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => {
                  const badge = STATUS_BADGE[v.status] || { cls: 'gray', label: v.status }
                  return (
                    <tr key={v.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{v.id}</td>
                      <td style={{ fontWeight: 600 }}>{v.patient_name}</td>
                      <td><span className="afya-badge gray">{v.visit_type}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--afya-text-muted)' }}>
                        {v.doctor_name || <em style={{ color: '#cbd5e1' }}>Unassigned</em>}
                      </td>
                      <td><span className={`afya-badge ${badge.cls}`}>{badge.label}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                        {new Date(v.visit_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                            <i className="bi bi-eye"></i>
                          </button>
                          {/* Quick status advance */}
                          {v.status === 'registered' && (
                            <button className="btn btn-sm btn-warning" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                              onClick={() => handleStatusUpdate(v.id, 'triage')}>
                              → Triage
                            </button>
                          )}
                          {v.status === 'waiting' && (
                            <button className="btn btn-sm btn-primary" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                              onClick={() => handleStatusUpdate(v.id, 'with_doctor')}>
                              → Doctor
                            </button>
                          )}
                          {v.status === 'pharmacy' && (
                            <button className="btn btn-sm btn-success" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                              onClick={() => handleStatusUpdate(v.id, 'billing')}>
                              → Billing
                            </button>
                          )}
                          {!['completed','cancelled'].includes(v.status) && (
                            <button className="btn btn-sm btn-outline-success" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                              onClick={() => handleStatusUpdate(v.id, 'completed')}>
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Visit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar-plus text-primary me-2"></i>New Visit
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <form id="visit-form" onSubmit={handleSubmit}>
                  <div className="afya-form-group">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Patient *</label>
                    <select name="patient" className="afya-form-control" required
                      value={form.patient} onChange={handleChange}>
                      <option value="">— Select patient —</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.national_id || 'No ID'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="afya-form-group">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Visit Type *</label>
                    <select name="visit_type" className="afya-form-control" value={form.visit_type} onChange={handleChange}>
                      {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="afya-form-group">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Attending Doctor</label>
                    <select name="attending_doctor" className="afya-form-control"
                      value={form.attending_doctor} onChange={handleChange}>
                      <option value="">— Assign later —</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="afya-form-group">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Notes</label>
                    <textarea name="notes" className="afya-form-control" rows={3}
                      value={form.notes} onChange={handleChange} placeholder="Reason for visit, notes..." />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="visit-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm"></span> Creating...</> : <><i className="bi bi-check-lg"></i> Create Visit</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}