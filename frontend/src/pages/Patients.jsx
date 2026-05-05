import React, { useEffect, useState, useCallback } from 'react'
import { patientAPI, getErrorMessage } from '../utils/api'

const GENDER = { M: 'Male', F: 'Female', O: 'Other' }
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN']
const INSURANCE_PROVIDERS = ['SHA','NHIF','AIR','BRITAM','JUBILEE','MADISON','RESOLUTION','CASH','OTHER']

const EMPTY_FORM = {
  first_name:'', last_name:'', date_of_birth:'', gender:'M',
  national_id:'', phone:'', email:'', address:'',
  blood_group:'UNKNOWN', sha_number:'', insurance_provider:'CASH',
  insurance_number:'', next_of_kin_name:'', next_of_kin_phone:'',
}

export default function Patients() {
  const [patients,  setPatients]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [selected,  setSelected]  = useState(null)   // patient detail view

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await patientAPI.list({ search })
      setPatients(data?.results || data || [])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchPatients(), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await patientAPI.create(form)
      setSuccess('Patient registered successfully.')
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchPatients()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const openModal = () => { setForm(EMPTY_FORM); setError(''); setShowModal(true) }

  return (
    <div>
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-people me-2 text-primary"></i>Patients</h4>
          <p>Register and manage patient records</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openModal}>
          <i className="bi bi-person-plus"></i> Register Patient
        </button>
      </div>

      {success && (
        <div className="alert-afya success mb-3">
          <i className="bi bi-check-circle"></i> {success}
        </div>
      )}

      {/* Search + stats row */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <div className="afya-input-icon">
            <i className="bi bi-search"></i>
            <input
              className="afya-form-control"
              placeholder="Search by name, ID, phone, SHA number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="col-12 col-md-6 d-flex gap-2 align-items-center justify-content-md-end">
          <span style={{ fontSize: 13, color: 'var(--afya-text-muted)' }}>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} found
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchPatients}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="afya-card p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <p className="mt-2 text-muted" style={{ fontSize: 13 }}>Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-person-x" style={{ fontSize: 40, color: 'var(--afya-text-muted)' }}></i>
            <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>
              {search ? 'No patients match your search.' : 'No patients registered yet.'}
            </p>
            <button className="btn btn-primary btn-sm mt-1" onClick={openModal}>Register First Patient</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="afya-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Age/Gender</th>
                  <th>National ID</th>
                  <th>Phone</th>
                  <th>Insurance</th>
                  <th>SHA Number</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--afya-text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: p.gender === 'F' ? '#fce7f3' : '#dbeafe',
                          color: p.gender === 'F' ? '#be185d' : '#1d4ed8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12, flexShrink: 0
                        }}>
                          {p.first_name?.[0]}{p.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--afya-text-muted)' }}>{p.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.age} yrs &nbsp;
                      <span className={`afya-badge ${p.gender === 'F' ? 'purple' : 'blue'}`} style={{ fontSize: 10 }}>
                        {GENDER[p.gender]}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.national_id || '—'}</td>
                    <td>{p.phone || '—'}</td>
                    <td>
                      <span className="afya-badge gray">{p.insurance_provider || 'CASH'}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sha_number || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString('en-KE')}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                          onClick={() => setSelected(p)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Register Patient Modal ── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus text-primary me-2"></i>Register New Patient
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                {error && (
                  <div className="alert-afya error mb-3">
                    <i className="bi bi-exclamation-circle"></i> {error}
                  </div>
                )}
                <form id="patient-form" onSubmit={handleSubmit}>
                  {/* Personal Info */}
                  <p className="section-title"><i className="bi bi-person"></i> Personal Information</p>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>First Name *</label>
                      <input name="first_name" className="afya-form-control" required
                        value={form.first_name} onChange={handleChange} placeholder="e.g. Wanjiku" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Last Name *</label>
                      <input name="last_name" className="afya-form-control" required
                        value={form.last_name} onChange={handleChange} placeholder="e.g. Kamau" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Date of Birth *</label>
                      <input name="date_of_birth" type="date" className="afya-form-control" required
                        value={form.date_of_birth} onChange={handleChange} />
                    </div>
                    <div className="col-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Gender *</label>
                      <select name="gender" className="afya-form-control" value={form.gender} onChange={handleChange}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                    <div className="col-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Blood Group</label>
                      <select name="blood_group" className="afya-form-control" value={form.blood_group} onChange={handleChange}>
                        {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>National ID</label>
                      <input name="national_id" className="afya-form-control"
                        value={form.national_id} onChange={handleChange} placeholder="e.g. 12345678" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Phone</label>
                      <input name="phone" className="afya-form-control"
                        value={form.phone} onChange={handleChange} placeholder="e.g. 0712345678" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Email</label>
                      <input name="email" type="email" className="afya-form-control"
                        value={form.email} onChange={handleChange} placeholder="optional" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Address</label>
                      <textarea name="address" className="afya-form-control" rows={2}
                        value={form.address} onChange={handleChange} placeholder="Town, County" />
                    </div>
                  </div>

                  {/* Insurance */}
                  <p className="section-title mt-4"><i className="bi bi-shield-check"></i> Insurance / SHA</p>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Insurance Provider</label>
                      <select name="insurance_provider" className="afya-form-control" value={form.insurance_provider} onChange={handleChange}>
                        {INSURANCE_PROVIDERS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Insurance / Policy Number</label>
                      <input name="insurance_number" className="afya-form-control"
                        value={form.insurance_number} onChange={handleChange} placeholder="Policy or member no." />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>SHA Number</label>
                      <input name="sha_number" className="afya-form-control"
                        value={form.sha_number} onChange={handleChange} placeholder="SHA/NHIF membership number" />
                    </div>
                  </div>

                  {/* Next of kin */}
                  <p className="section-title mt-4"><i className="bi bi-people"></i> Next of Kin</p>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Next of Kin Name</label>
                      <input name="next_of_kin_name" className="afya-form-control"
                        value={form.next_of_kin_name} onChange={handleChange} placeholder="Full name" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Next of Kin Phone</label>
                      <input name="next_of_kin_phone" className="afya-form-control"
                        value={form.next_of_kin_phone} onChange={handleChange} placeholder="0712345678" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0" style={{ padding: '12px 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="patient-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm"></span> Saving...</> : <><i className="bi bi-check-lg"></i> Register Patient</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Patient Detail Modal ── */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">Patient Details</h5>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px 24px' }}>
                <div className="text-center mb-3">
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 10px',
                    background: selected.gender === 'F' ? '#fce7f3' : '#dbeafe',
                    color: selected.gender === 'F' ? '#be185d' : '#1d4ed8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 22
                  }}>
                    {selected.first_name?.[0]}{selected.last_name?.[0]}
                  </div>
                  <h6 className="mb-0 fw-bold">{selected.first_name} {selected.last_name}</h6>
                  <small className="text-muted">{selected.age} yrs · {GENDER[selected.gender]}</small>
                </div>
                {[
                  ['National ID',    selected.national_id    || '—'],
                  ['Phone',          selected.phone          || '—'],
                  ['Blood Group',    selected.blood_group],
                  ['Insurance',      selected.insurance_provider || 'CASH'],
                  ['SHA Number',     selected.sha_number     || '—'],
                  ['Policy Number',  selected.insurance_number || '—'],
                  ['Next of Kin',    selected.next_of_kin_name  || '—'],
                  ['NOK Phone',      selected.next_of_kin_phone || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="d-flex justify-content-between py-2"
                    style={{ borderBottom: '1px solid var(--afya-border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--afya-text-muted)' }}>{label}</span>
                    <span className="fw-semibold">{val}</span>
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
                <button className="btn btn-primary btn-sm"><i className="bi bi-calendar-plus me-1"></i>New Visit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}