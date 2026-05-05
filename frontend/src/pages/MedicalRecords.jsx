import React, { useEffect, useState, useCallback } from 'react'
import { recordAPI, visitAPI, getErrorMessage } from '../utils/api'

const EMPTY_FORM = {
  visit: '', doctor: '',
  history_of_presenting_illness: '',
  examination_findings: '',
  diagnosis: '',
  secondary_diagnosis: '',
  treatment_plan: '',
  prescriptions: '',
  referred_to_radiology: false,
  radiology_request_notes: '',
  referred_to_pharmacy: false,
  follow_up_date: '',
  doctor_notes: '',
}

export default function MedicalRecords() {
  const userId = localStorage.getItem('user_id')
  const role   = localStorage.getItem('role')

  const [records,      setRecords]      = useState([])
  const [myQueue,      setMyQueue]      = useState([])   // visits waiting for doctor
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [form,         setForm]         = useState({ ...EMPTY_FORM, doctor: userId })
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [activeTab,    setActiveTab]    = useState('queue')
  const [expanded,     setExpanded]     = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [recRes, visitRes] = await Promise.all([
        recordAPI.list(),
        visitAPI.list({ status: 'with_doctor' }),
      ])
      setRecords(recRes.data?.results   || recRes.data   || [])
      setMyQueue(visitRes.data?.results || visitRes.data || [])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const openRecord = (visit) => {
    setForm({ ...EMPTY_FORM, doctor: userId, visit: visit.id })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.diagnosis.trim()) { setError('Diagnosis is required.'); return }
    setSaving(true); setError('')
    try {
      await recordAPI.create(form)
      setSuccess('Medical record saved. Visit status updated automatically.')
      setShowModal(false)
      fetchData()
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-file-earmark-text me-2 text-primary"></i>Medical Records</h4>
          <p>Clinical notes, diagnoses and treatment plans</p>
        </div>
        <span className="afya-badge blue">
          <i className="bi bi-person-check"></i> {myQueue.length} Patients Waiting
        </span>
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        {[['queue',`My Queue (${myQueue.length})`],['records','Records History']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 20 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : activeTab === 'queue' ? (

        /* ── Doctor Queue ── */
        myQueue.length === 0 ? (
          <div className="afya-card text-center py-5">
            <i className="bi bi-check-circle" style={{ fontSize: 40, color: 'var(--afya-green)' }}></i>
            <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>Your queue is empty. All patients seen! ✓</p>
          </div>
        ) : (
          <div className="row g-3">
            {myQueue.map(v => (
              <div className="col-12 col-lg-6" key={v.id}>
                <div className="afya-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{v.patient_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                        Visit #{v.id} · {v.visit_type}
                      </div>
                    </div>
                    <span className="afya-badge blue">With Doctor</span>
                  </div>
                  {v.has_triage ? (
                    <div className="alert-afya success mb-3" style={{ fontSize: 12 }}>
                      <i className="bi bi-check-circle"></i> Triage completed
                    </div>
                  ) : (
                    <div className="alert-afya error mb-3" style={{ fontSize: 12 }}>
                      <i className="bi bi-exclamation-triangle"></i> No triage on record
                    </div>
                  )}
                  <button className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => openRecord(v)}
                    disabled={v.has_record}>
                    {v.has_record
                      ? <><i className="bi bi-check"></i> Record exists</>
                      : <><i className="bi bi-pencil-square"></i> Write Medical Record</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )

      ) : (

        /* ── Records History ── */
        <div className="afya-card p-0">
          {records.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x" style={{ fontSize: 40, color: 'var(--afya-text-muted)' }}></i>
              <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>No records found.</p>
            </div>
          ) : records.map(r => (
            <div key={r.id} style={{ borderBottom: '1px solid var(--afya-border)' }}>
              <div
                className="d-flex justify-content-between align-items-center"
                style={{ padding: '14px 20px', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>{r.patient_name}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--afya-text-muted)' }}>
                    Visit #{r.visit}
                  </span>
                  <span style={{ marginLeft: 10 }}>
                    <span className="afya-badge blue" style={{ fontSize: 11 }}>{r.diagnosis}</span>
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-KE')}
                  </span>
                  <i className={`bi ${expanded === r.id ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                    style={{ color: 'var(--afya-text-muted)' }}></i>
                </div>
              </div>

              {expanded === r.id && (
                <div style={{ padding: '0 20px 20px', background: '#f8fafc' }}>
                  <div className="row g-3" style={{ fontSize: 13 }}>
                    {[
                      ['Dr. Attending', r.doctor_name],
                      ['Primary Diagnosis', r.diagnosis],
                      ['Secondary Diagnosis', r.secondary_diagnosis || '—'],
                      ['Follow-up Date', r.follow_up_date || 'None'],
                    ].map(([label, val]) => (
                      <div className="col-6 col-md-3" key={label}>
                        <div style={{ color: 'var(--afya-text-muted)', fontSize: 11 }}>{label}</div>
                        <div style={{ fontWeight: 600 }}>{val}</div>
                      </div>
                    ))}
                    {r.history_of_presenting_illness && (
                      <div className="col-12">
                        <div style={{ color: 'var(--afya-text-muted)', fontSize: 11, marginBottom: 2 }}>HPI</div>
                        <div style={{ background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--afya-border)' }}>
                          {r.history_of_presenting_illness}
                        </div>
                      </div>
                    )}
                    {r.prescriptions && (
                      <div className="col-12">
                        <div style={{ color: 'var(--afya-text-muted)', fontSize: 11, marginBottom: 2 }}>Prescriptions</div>
                        <div style={{ background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--afya-border)', fontFamily: 'monospace', fontSize: 12 }}>
                          {r.prescriptions}
                        </div>
                      </div>
                    )}
                    <div className="col-12 d-flex gap-2">
                      {r.referred_to_radiology && <span className="afya-badge purple"><i className="bi bi-lungs"></i> Referred to Radiology</span>}
                      {r.referred_to_pharmacy   && <span className="afya-badge teal"><i className="bi bi-capsule"></i> Referred to Pharmacy</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Medical Record Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square text-primary me-2"></i>Medical Record — Visit #{form.visit}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <form id="record-form" onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* HPI */}
                    <div className="col-12">
                      <p className="section-title mb-2"><i className="bi bi-journal-text"></i> History of Presenting Illness</p>
                      <textarea name="history_of_presenting_illness" className="afya-form-control" rows={4}
                        value={form.history_of_presenting_illness} onChange={handleChange}
                        placeholder="Describe the patient's history of the presenting illness..." />
                    </div>
                    {/* Examination */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Examination Findings</label>
                      <textarea name="examination_findings" className="afya-form-control" rows={3}
                        value={form.examination_findings} onChange={handleChange}
                        placeholder="General appearance, systemic examination findings..." />
                    </div>
                    {/* Diagnosis */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Primary Diagnosis *</label>
                      <input name="diagnosis" className="afya-form-control" required
                        value={form.diagnosis} onChange={handleChange}
                        placeholder="e.g. J06.9 — Acute upper respiratory tract infection" />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Secondary Diagnosis</label>
                      <input name="secondary_diagnosis" className="afya-form-control"
                        value={form.secondary_diagnosis} onChange={handleChange} placeholder="Optional" />
                    </div>
                    {/* Treatment */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Treatment Plan</label>
                      <textarea name="treatment_plan" className="afya-form-control" rows={3}
                        value={form.treatment_plan} onChange={handleChange}
                        placeholder="Outline the treatment plan..." />
                    </div>
                    {/* Prescriptions */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>
                        <i className="bi bi-capsule me-1 text-primary"></i>Prescriptions
                      </label>
                      <textarea name="prescriptions" className="afya-form-control" rows={4}
                        value={form.prescriptions} onChange={handleChange}
                        placeholder={`e.g.\n1. Amoxicillin 500mg PO TDS x 7 days\n2. Paracetamol 1g PO PRN\n3. ORS sachets`}
                        style={{ fontFamily: 'monospace', fontSize: 13 }} />
                    </div>
                    {/* Referrals */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Referrals</label>
                      <div className="d-flex gap-4 mt-1">
                        <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" name="referred_to_pharmacy" className="form-check-input m-0"
                            checked={form.referred_to_pharmacy} onChange={handleChange} />
                          <i className="bi bi-capsule text-teal"></i> Refer to Pharmacy
                        </label>
                        <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" name="referred_to_radiology" className="form-check-input m-0"
                            checked={form.referred_to_radiology} onChange={handleChange} />
                          <i className="bi bi-lungs text-purple"></i> Refer to Radiology
                        </label>
                      </div>
                    </div>
                    {form.referred_to_radiology && (
                      <div className="col-12">
                        <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Radiology Request Notes</label>
                        <textarea name="radiology_request_notes" className="afya-form-control" rows={2}
                          value={form.radiology_request_notes} onChange={handleChange}
                          placeholder="e.g. CXR PA view — rule out pneumonia" />
                      </div>
                    )}
                    {/* Follow-up + notes */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Follow-up Date</label>
                      <input type="date" name="follow_up_date" className="afya-form-control"
                        value={form.follow_up_date} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Doctor's Notes</label>
                      <textarea name="doctor_notes" className="afya-form-control" rows={2}
                        value={form.doctor_notes} onChange={handleChange}
                        placeholder="Any additional clinical notes..." />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="record-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm"></span> Saving...</> : <><i className="bi bi-check-lg"></i> Save Record</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}