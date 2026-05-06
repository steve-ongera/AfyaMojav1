import React, { useEffect, useState, useCallback } from 'react'
import { visitAPI, recordAPI, getErrorMessage } from '../utils/api'

const SCAN_TYPES = [
  'X-Ray (CXR)', 'X-Ray (Limb)', 'Ultrasound (Abdomen)', 'Ultrasound (Pelvis)',
  'CT Scan (Head)', 'CT Scan (Chest)', 'CT Scan (Abdomen)', 'MRI (Brain)',
  'MRI (Spine)', 'Mammogram', 'Echocardiogram', 'Other',
]

export default function Radiology() {
  const [queue,       setQueue]       = useState([])
  const [records,     setRecords]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [reportModal, setReportModal] = useState(null)
  const [report,      setReport]      = useState({ scan_type: '', findings: '', impression: '', recommendation: '' })
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [activeTab,   setActiveTab]   = useState('pending')
  const [completed,   setCompleted]   = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pendRes, recRes] = await Promise.all([
        visitAPI.list({ status: 'radiology' }),
        recordAPI.list(),
      ])
      const visits   = pendRes.data?.results || pendRes.data || []
      const allRecs  = recRes.data?.results  || recRes.data  || []
      setQueue(visits)
      setRecords(allRecs)
      // Completed = visits that were in radiology and now moved on
      setCompleted(allRecs.filter(r => r.referred_to_radiology))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getRecord = (visitId) => records.find(r => r.visit === visitId)

  const openReport = (visit) => {
    setReportModal(visit)
    setReport({ scan_type: '', findings: '', impression: '', recommendation: '' })
    setError('')
  }

  const handleSubmitReport = async () => {
    if (!report.findings.trim() || !report.impression.trim()) {
      setError('Findings and impression are required.')
      return
    }
    setSaving(true)
    try {
      // Update visit status to billing after radiology
      await visitAPI.updateStatus(reportModal.id, 'billing')
      setSuccess(`Report saved for ${reportModal.patient_name}. Patient sent to billing.`)
      setReportModal(null)
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
          <h4><i className="bi bi-lungs me-2 text-primary"></i>Radiology</h4>
          <p>Imaging request queue and report management</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="afya-badge purple">
            <i className="bi bi-clock"></i> {queue.length} Pending Scans
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}
      {error && !reportModal && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        {[
          ['pending',  `Pending (${queue.length})`],
          ['completed',`Completed (${completed.length})`],
        ].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 20 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : activeTab === 'pending' ? (

        queue.length === 0 ? (
          <div className="afya-card text-center py-5">
            <i className="bi bi-check-circle" style={{ fontSize: 40, color: 'var(--afya-green)' }}></i>
            <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>
              No pending radiology requests. Queue is clear! ✓
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {queue.map(visit => {
              const rec    = getRecord(visit.id)
              const isOpen = selected?.id === visit.id
              return (
                <div className="col-12 col-lg-6" key={visit.id}>
                  <div className="afya-card h-100" style={{
                    border: isOpen ? '2px solid var(--afya-primary)' : '1px solid var(--afya-border)'
                  }}>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{visit.patient_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                          Visit #{visit.id} · {visit.visit_type}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                          Ref: Dr. {visit.doctor_name || 'N/A'} ·{' '}
                          {new Date(visit.visit_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="afya-badge purple">
                        <i className="bi bi-lungs"></i> Radiology
                      </span>
                    </div>

                    {/* Radiology request notes */}
                    {rec?.radiology_request_notes && (
                      <div style={{
                        background: '#faf5ff', border: '1px solid #e9d5ff',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>
                          REQUESTED INVESTIGATION
                        </div>
                        {rec.radiology_request_notes}
                      </div>
                    )}

                    {rec?.diagnosis && (
                      <div style={{ fontSize: 12, color: 'var(--afya-text-muted)', marginBottom: 14 }}>
                        <strong>Diagnosis:</strong> {rec.diagnosis}
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                        onClick={() => openReport(visit)}
                      >
                        <i className="bi bi-file-earmark-text"></i> Write Report
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setSelected(isOpen ? null : visit)}
                      >
                        <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                      </button>
                    </div>

                    {/* Expanded record detail */}
                    {isOpen && rec && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--afya-border)', fontSize: 13 }}>
                        {rec.examination_findings && (
                          <div className="mb-2">
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--afya-text-muted)', marginBottom: 2 }}>EXAMINATION FINDINGS</div>
                            <div>{rec.examination_findings}</div>
                          </div>
                        )}
                        {rec.history_of_presenting_illness && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--afya-text-muted)', marginBottom: 2 }}>HPI</div>
                            <div>{rec.history_of_presenting_illness}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )

      ) : (

        /* Completed radiology */
        <div className="afya-card p-0">
          {completed.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x" style={{ fontSize: 40, color: 'var(--afya-text-muted)' }}></i>
              <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>No completed radiology records.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="afya-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Diagnosis</th>
                    <th>Radiology Request</th>
                    <th>Doctor</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                      <td>
                        <span className="afya-badge blue" style={{ fontSize: 11 }}>{r.diagnosis}</span>
                      </td>
                      <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.radiology_request_notes || '—'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--afya-text-muted)' }}>
                        Dr. {r.doctor_name || 'N/A'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-KE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Write Report Modal */}
      {reportModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-file-earmark-text text-primary me-2"></i>
                  Radiology Report — {reportModal.patient_name}
                </h5>
                <button className="btn-close" onClick={() => setReportModal(null)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Scan / Investigation Type *</label>
                    <select className="afya-form-control"
                      value={report.scan_type}
                      onChange={e => setReport(p => ({ ...p, scan_type: e.target.value }))}>
                      <option value="">— Select scan type —</option>
                      {SCAN_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Findings *</label>
                    <textarea className="afya-form-control" rows={5}
                      value={report.findings}
                      onChange={e => setReport(p => ({ ...p, findings: e.target.value }))}
                      placeholder="Describe the imaging findings in detail..." />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Impression / Conclusion *</label>
                    <textarea className="afya-form-control" rows={3}
                      value={report.impression}
                      onChange={e => setReport(p => ({ ...p, impression: e.target.value }))}
                      placeholder="Radiologist's conclusion and interpretation..." />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Recommendation</label>
                    <textarea className="afya-form-control" rows={2}
                      value={report.recommendation}
                      onChange={e => setReport(p => ({ ...p, recommendation: e.target.value }))}
                      placeholder="Follow-up recommendations, repeat scan, correlate clinically, etc." />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setReportModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={handleSubmitReport}
                  disabled={saving}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm"></span> Submitting...</>
                    : <><i className="bi bi-check-lg"></i> Submit Report & Send to Billing</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}