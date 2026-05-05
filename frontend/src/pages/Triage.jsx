import React, { useEffect, useState, useCallback } from 'react'
import { triageAPI, visitAPI, getErrorMessage } from '../utils/api'

const URGENCY_CONFIG = {
  green:  { cls: 'green',  label: 'Green — Non-Urgent',  icon: 'bi-circle-fill',  color: '#16a34a' },
  yellow: { cls: 'yellow', label: 'Yellow — Urgent',     icon: 'bi-circle-fill',  color: '#ca8a04' },
  red:    { cls: 'red',    label: 'Red — Critical',      icon: 'bi-circle-fill',  color: '#dc2626' },
}

const EMPTY_FORM = {
  visit: '', nurse: '',
  temperature: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
  pulse_rate: '', respiratory_rate: '', oxygen_saturation: '',
  weight: '', height: '', chief_complaint: '', urgency_level: 'green',
}

const VitalCard = ({ icon, label, value, unit, color }) => (
  <div style={{
    background: '#f8fafc', borderRadius: 10, padding: '12px 16px',
    border: '1px solid var(--afya-border)', textAlign: 'center'
  }}>
    <i className={`bi ${icon}`} style={{ fontSize: 18, color }}></i>
    <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--afya-text)' }}>
      {value || <span style={{ color: '#cbd5e1' }}>—</span>}
      {value && <span style={{ fontSize: 12, color: 'var(--afya-text-muted)', fontWeight: 400 }}> {unit}</span>}
    </div>
    <div style={{ fontSize: 11, color: 'var(--afya-text-muted)', marginTop: 2 }}>{label}</div>
  </div>
)

export default function Triage() {
  const userId = localStorage.getItem('user_id')

  const [pendingVisits, setPendingVisits] = useState([])
  const [triageList,    setTriageList]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [form,          setForm]          = useState({ ...EMPTY_FORM, nurse: userId })
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')
  const [activeTab,     setActiveTab]     = useState('pending')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [visitsRes, triageRes] = await Promise.all([
        visitAPI.list({ status: 'triage' }),
        triageAPI.list(),
      ])
      setPendingVisits(visitsRes.data?.results || visitsRes.data || [])
      setTriageList(triageRes.data?.results   || triageRes.data || [])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const openTriage = (visit) => {
    setForm({ ...EMPTY_FORM, nurse: userId, visit: visit.id })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.chief_complaint.trim()) { setError('Chief complaint is required.'); return }
    setSaving(true); setError('')
    try {
      // Clean empty strings to null
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
      )
      await triageAPI.create(payload)
      setSuccess('Triage recorded. Visit advanced to Waiting queue.')
      setShowModal(false)
      fetchData()
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  // BMI preview
  const bmi = form.weight && form.height
    ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
    : null

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-heart-pulse me-2 text-primary"></i>Triage</h4>
          <p>Record patient vitals and assign urgency level</p>
        </div>
        <div className="d-flex gap-2">
          <span className="afya-badge yellow">
            <i className="bi bi-clock"></i> {pendingVisits.length} Waiting for Triage
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}
      {error   && !showModal && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        {['pending','completed'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 20, textTransform: 'capitalize' }}>
            {tab === 'pending' ? `Pending Triage (${pendingVisits.length})` : `Triaged Today (${triageList.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : activeTab === 'pending' ? (
        <>
          {pendingVisits.length === 0 ? (
            <div className="afya-card text-center py-5">
              <i className="bi bi-check-circle" style={{ fontSize: 40, color: 'var(--afya-green)' }}></i>
              <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>No patients waiting for triage. Queue is clear! ✓</p>
            </div>
          ) : (
            <div className="row g-3">
              {pendingVisits.map(v => (
                <div className="col-12 col-md-6 col-lg-4" key={v.id}>
                  <div className="afya-card h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{v.patient_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>Visit #{v.id} · {v.visit_type}</div>
                      </div>
                      <span className="afya-badge yellow">Waiting</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--afya-text-muted)', marginBottom: 14 }}>
                      <i className="bi bi-clock me-1"></i>
                      {new Date(v.visit_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      &nbsp;·&nbsp;
                      Dr. {v.doctor_name || 'TBA'}
                    </div>
                    <button className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => openTriage(v)}>
                      <i className="bi bi-heart-pulse"></i> Start Triage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Triaged list */
        <div className="afya-card p-0">
          <div className="table-responsive">
            <table className="afya-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Chief Complaint</th>
                  <th>BP</th>
                  <th>Temp</th>
                  <th>SpO2</th>
                  <th>Pulse</th>
                  <th>Urgency</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {triageList.map(t => {
                  const urg = URGENCY_CONFIG[t.urgency_level] || URGENCY_CONFIG.green
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.patient_name}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.chief_complaint}
                      </td>
                      <td>{t.blood_pressure || '—'}</td>
                      <td>{t.temperature ? `${t.temperature}°C` : '—'}</td>
                      <td>{t.oxygen_saturation ? `${t.oxygen_saturation}%` : '—'}</td>
                      <td>{t.pulse_rate ? `${t.pulse_rate} bpm` : '—'}</td>
                      <td>
                        <span className={`afya-badge ${urg.cls}`}>
                          <i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i> {t.urgency_level.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                        {new Date(t.triaged_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Triage Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-heart-pulse text-danger me-2"></i>Triage Assessment
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <form id="triage-form" onSubmit={handleSubmit}>
                  {/* Vitals */}
                  <p className="section-title"><i className="bi bi-activity"></i> Vital Signs</p>
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Temperature (°C)</label>
                      <input name="temperature" type="number" step="0.1" className="afya-form-control"
                        value={form.temperature} onChange={handleChange} placeholder="36.5" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Systolic BP (mmHg)</label>
                      <input name="blood_pressure_systolic" type="number" className="afya-form-control"
                        value={form.blood_pressure_systolic} onChange={handleChange} placeholder="120" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Diastolic BP (mmHg)</label>
                      <input name="blood_pressure_diastolic" type="number" className="afya-form-control"
                        value={form.blood_pressure_diastolic} onChange={handleChange} placeholder="80" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Pulse Rate (bpm)</label>
                      <input name="pulse_rate" type="number" className="afya-form-control"
                        value={form.pulse_rate} onChange={handleChange} placeholder="72" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Resp. Rate (bpm)</label>
                      <input name="respiratory_rate" type="number" className="afya-form-control"
                        value={form.respiratory_rate} onChange={handleChange} placeholder="16" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>SpO2 (%)</label>
                      <input name="oxygen_saturation" type="number" step="0.1" className="afya-form-control"
                        value={form.oxygen_saturation} onChange={handleChange} placeholder="98" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Weight (kg)</label>
                      <input name="weight" type="number" step="0.1" className="afya-form-control"
                        value={form.weight} onChange={handleChange} placeholder="70" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Height (cm)</label>
                      <input name="height" type="number" step="0.1" className="afya-form-control"
                        value={form.height} onChange={handleChange} placeholder="170" />
                    </div>
                  </div>

                  {/* BMI preview */}
                  {bmi && (
                    <div className="mt-2" style={{ fontSize: 13, color: 'var(--afya-text-muted)' }}>
                      <i className="bi bi-calculator me-1"></i>
                      BMI: <strong style={{ color: 'var(--afya-text)' }}>{bmi}</strong>
                      {bmi < 18.5 ? ' — Underweight' : bmi < 25 ? ' — Normal' : bmi < 30 ? ' — Overweight' : ' — Obese'}
                    </div>
                  )}

                  {/* Chief complaint + urgency */}
                  <p className="section-title mt-4"><i className="bi bi-chat-left-text"></i> Clinical Assessment</p>
                  <div className="afya-form-group">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Chief Complaint *</label>
                    <textarea name="chief_complaint" className="afya-form-control" rows={3} required
                      value={form.chief_complaint} onChange={handleChange}
                      placeholder="Patient's main presenting complaint..." />
                  </div>

                  <div className="afya-form-group">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Urgency Level *</label>
                    <div className="d-flex gap-2 mt-1">
                      {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                        <label key={key} style={{
                          flex: 1, border: `2px solid ${form.urgency_level === key ? cfg.color : 'var(--afya-border)'}`,
                          borderRadius: 10, padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
                          background: form.urgency_level === key ? `${cfg.color}15` : 'transparent',
                          transition: 'all .15s'
                        }}>
                          <input type="radio" name="urgency_level" value={key}
                            checked={form.urgency_level === key} onChange={handleChange}
                            style={{ display: 'none' }} />
                          <i className="bi bi-circle-fill" style={{ color: cfg.color, fontSize: 10, display: 'block', marginBottom: 4 }}></i>
                          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="triage-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm"></span> Saving...</> : <><i className="bi bi-check-lg"></i> Save Triage</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}