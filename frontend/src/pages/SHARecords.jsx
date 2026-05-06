import React, { useEffect, useState, useCallback } from 'react'
import { shaAPI, visitAPI, patientAPI, getErrorMessage } from '../utils/api'

const PROVIDERS = ['SHA','NHIF','AIR','BRITAM','JUBILEE','MADISON','RESOLUTION','CASH','OTHER']
const STATUSES  = ['pending','submitted','approved','rejected','partial']

const STATUS_BADGE = {
  pending:   { cls: 'yellow', label: 'Pending' },
  submitted: { cls: 'blue',   label: 'Submitted' },
  approved:  { cls: 'green',  label: 'Approved' },
  rejected:  { cls: 'red',    label: 'Rejected' },
  partial:   { cls: 'purple', label: 'Partial' },
}

const EMPTY_FORM = {
  visit: '', patient: '', insurance_provider: 'CASH',
  member_number: '', pre_authorization_code: '',
  total_bill: '', claimed_amount: '', patient_copay: '0',
  submitted_by: '',
}

const EMPTY_UPDATE = {
  claim_status: 'pending', approved_amount: '',
  patient_copay: '', claim_reference: '', rejection_reason: '',
}

export default function SHARecords() {
  const userId = localStorage.getItem('user_id')
  const role   = localStorage.getItem('role')

  const [records,    setRecords]    = useState([])
  const [billingQ,   setBillingQ]   = useState([])  // visits at billing status
  const [patients,   setPatients]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState({ claim_status: '', provider: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [showUpdate, setShowUpdate] = useState(null)
  const [form,       setForm]       = useState({ ...EMPTY_FORM, submitted_by: userId })
  const [updateForm, setUpdateForm] = useState(EMPTY_UPDATE)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.claim_status) params.claim_status = filter.claim_status
      if (filter.provider)     params.provider     = filter.provider

      const [shaRes, billRes, patRes] = await Promise.all([
        shaAPI.list(params),
        visitAPI.list({ status: 'billing' }),
        patientAPI.list(),
      ])
      setRecords(shaRes.data?.results   || shaRes.data   || [])
      setBillingQ(billRes.data?.results || billRes.data  || [])
      setPatients(patRes.data?.results  || patRes.data   || [])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleChange       = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const handleUpdateChange = e => setUpdateForm(p => ({ ...p, [e.target.name]: e.target.value }))

  // Auto-fill patient when visit selected
  const handleVisitChange = e => {
    const visitId = e.target.value
    const visit   = billingQ.find(v => String(v.id) === String(visitId))
    setForm(p => ({ ...p, visit: visitId, patient: visit ? String(visit.patient) : '' }))
  }

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await shaAPI.create({ ...form, submitted_by: userId })
      setSuccess('Billing record created.')
      setShowCreate(false)
      setForm({ ...EMPTY_FORM, submitted_by: userId })
      fetchData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) { setError(getErrorMessage(e)) }
    finally     { setSaving(false) }
  }

  const openUpdate = (record) => {
    setShowUpdate(record)
    setUpdateForm({
      claim_status:     record.claim_status,
      approved_amount:  record.approved_amount,
      patient_copay:    record.patient_copay,
      claim_reference:  record.claim_reference  || '',
      rejection_reason: record.rejection_reason || '',
    })
    setError('')
  }

  const handleUpdate = async () => {
    setSaving(true); setError('')
    try {
      await shaAPI.updateStatus(showUpdate.id, updateForm)
      setSuccess('Claim status updated.')
      setShowUpdate(null)
      fetchData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) { setError(getErrorMessage(e)) }
    finally     { setSaving(false) }
  }

  // Summary totals
  const totalBilled   = records.reduce((s, r) => s + parseFloat(r.total_bill || 0), 0)
  const totalApproved = records.reduce((s, r) => s + parseFloat(r.approved_amount || 0), 0)
  const pending       = records.filter(r => r.claim_status === 'pending').length

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-shield-check me-2 text-primary"></i>SHA & Insurance Records</h4>
          <p>Billing, claim tracking and insurance management</p>
        </div>
        <div className="d-flex gap-2">
          {billingQ.length > 0 && (
            <span className="afya-badge yellow">
              <i className="bi bi-cash-stack"></i> {billingQ.length} Awaiting Billing
            </span>
          )}
          {['cashier','admin'].includes(role) && (
            <button className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => { setForm({ ...EMPTY_FORM, submitted_by: userId }); setError(''); setShowCreate(true) }}>
              <i className="bi bi-plus-lg"></i> New Billing Record
            </button>
          )}
        </div>
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}
      {error && !showCreate && !showUpdate && (
        <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>
      )}

      {/* Summary stat cards */}
      <div className="row g-3 mb-3">
        {[
          { icon: 'bi-receipt',         color: 'blue',   value: `KES ${totalBilled.toLocaleString()}`,    label: 'Total Billed' },
          { icon: 'bi-check-circle',    color: 'green',  value: `KES ${totalApproved.toLocaleString()}`,  label: 'Total Approved' },
          { icon: 'bi-hourglass-split', color: 'yellow', value: pending,                                   label: 'Pending Claims' },
          { icon: 'bi-people',          color: 'purple', value: billingQ.length,                            label: 'In Billing Queue' },
        ].map(({ icon, color, value, label }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="afya-stat-card">
              <div className={`afya-stat-icon ${color}`}><i className={`bi ${icon}`}></i></div>
              <div>
                <div className="afya-stat-value" style={{ fontSize: 20 }}>{value}</div>
                <div className="afya-stat-label">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="afya-card mb-3">
        <div className="row g-3 align-items-center">
          <div className="col-auto">
            <label style={{ fontSize: 12, fontWeight: 600 }}>Claim Status</label>
            <select className="afya-form-control mt-1" style={{ minWidth: 160 }}
              value={filter.claim_status}
              onChange={e => setFilter(p => ({ ...p, claim_status: e.target.value }))}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                  {STATUS_BADGE[s]?.label || s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <label style={{ fontSize: 12, fontWeight: 600 }}>Provider</label>
            <select className="afya-form-control mt-1" style={{ minWidth: 140 }}
              value={filter.provider}
              onChange={e => setFilter(p => ({ ...p, provider: e.target.value }))}>
              <option value="">All Providers</option>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-auto ms-auto d-flex align-items-end" style={{ marginTop: 20 }}>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Records table */}
      <div className="afya-card p-0">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : records.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-receipt" style={{ fontSize: 40, color: 'var(--afya-text-muted)' }}></i>
            <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>No billing records found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="afya-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Visit</th>
                  <th>Provider</th>
                  <th>Member No.</th>
                  <th>Total Bill</th>
                  <th>Claimed</th>
                  <th>Approved</th>
                  <th>Co-pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const badge = STATUS_BADGE[r.claim_status] || { cls: 'gray', label: r.claim_status }
                  return (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--afya-text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{r.visit}</td>
                      <td>
                        <span className={`afya-badge ${r.insurance_provider === 'CASH' ? 'gray' : 'blue'}`}>
                          {r.insurance_provider}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{r.member_number || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {parseFloat(r.total_bill).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {parseFloat(r.claimed_amount).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--afya-green)', fontWeight: 600 }}>
                        {parseFloat(r.approved_amount).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {parseFloat(r.patient_copay).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                      </td>
                      <td>
                        <span className={`afya-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td>
                        {['cashier','admin'].includes(role) && r.claim_status !== 'approved' && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6 }}
                            onClick={() => openUpdate(r)}
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Billing Record Modal */}
      {showCreate && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-receipt text-primary me-2"></i>New Billing Record
                </h5>
                <button className="btn-close" onClick={() => setShowCreate(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <form id="sha-form" onSubmit={handleCreate}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Visit (Billing Queue) *</label>
                      <select name="visit" className="afya-form-control" required
                        value={form.visit} onChange={handleVisitChange}>
                        <option value="">— Select visit —</option>
                        {billingQ.map(v => (
                          <option key={v.id} value={v.id}>
                            #{v.id} — {v.patient_name} ({v.visit_type})
                          </option>
                        ))}
                      </select>
                      {billingQ.length === 0 && (
                        <div style={{ fontSize: 11, color: 'var(--afya-text-muted)', marginTop: 4 }}>
                          No visits currently in billing status.
                        </div>
                      )}
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Insurance Provider *</label>
                      <select name="insurance_provider" className="afya-form-control"
                        value={form.insurance_provider} onChange={handleChange}>
                        {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Member / Policy Number</label>
                      <input name="member_number" className="afya-form-control"
                        value={form.member_number} onChange={handleChange} placeholder="SHA/Insurance member no." />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Pre-Authorization Code</label>
                      <input name="pre_authorization_code" className="afya-form-control"
                        value={form.pre_authorization_code} onChange={handleChange} placeholder="If applicable" />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Total Bill (KES) *</label>
                      <input name="total_bill" type="number" step="0.01" min="0" className="afya-form-control" required
                        value={form.total_bill} onChange={handleChange} placeholder="0.00" />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Claimed Amount (KES)</label>
                      <input name="claimed_amount" type="number" step="0.01" min="0" className="afya-form-control"
                        value={form.claimed_amount} onChange={handleChange} placeholder="0.00" />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Patient Co-pay (KES)</label>
                      <input name="patient_copay" type="number" step="0.01" min="0" className="afya-form-control"
                        value={form.patient_copay} onChange={handleChange} placeholder="0.00" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" form="sha-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm"></span> Saving...</>
                    : <><i className="bi bi-check-lg"></i> Create Record</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Claim Status Modal */}
      {showUpdate && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil text-primary me-2"></i>Update Claim — {showUpdate.patient_name}
                </h5>
                <button className="btn-close" onClick={() => setShowUpdate(null)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Claim Status</label>
                    <select name="claim_status" className="afya-form-control"
                      value={updateForm.claim_status} onChange={handleUpdateChange}>
                      {STATUSES.map(s => (
                        <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Approved Amount (KES)</label>
                    <input name="approved_amount" type="number" step="0.01" min="0" className="afya-form-control"
                      value={updateForm.approved_amount} onChange={handleUpdateChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Patient Co-pay (KES)</label>
                    <input name="patient_copay" type="number" step="0.01" min="0" className="afya-form-control"
                      value={updateForm.patient_copay} onChange={handleUpdateChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Claim Reference No.</label>
                    <input name="claim_reference" className="afya-form-control"
                      value={updateForm.claim_reference} onChange={handleUpdateChange}
                      placeholder="Insurer's reference number" />
                  </div>
                  {updateForm.claim_status === 'rejected' && (
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Rejection Reason</label>
                      <textarea name="rejection_reason" className="afya-form-control" rows={3}
                        value={updateForm.rejection_reason} onChange={handleUpdateChange}
                        placeholder="Reason for rejection from insurer..." />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowUpdate(null)}>Cancel</button>
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleUpdate} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm"></span> Updating...</>
                    : <><i className="bi bi-check-lg"></i> Update Claim</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}