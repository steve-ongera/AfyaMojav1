import React, { useEffect, useState, useCallback } from 'react'
import { recordAPI, visitAPI, medicineAPI, getErrorMessage } from '../utils/api'

export default function Pharmacy() {
  const [queue,      setQueue]      = useState([])   // visits at pharmacy status
  const [records,    setRecords]    = useState([])   // medical records with prescriptions
  const [medicines,  setMedicines]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null) // expanded prescription
  const [dispensing, setDispensing] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [queueRes, medsRes] = await Promise.all([
        visitAPI.list({ status: 'pharmacy' }),
        medicineAPI.list(),
      ])
      const visits = queueRes.data?.results || queueRes.data || []
      setQueue(visits)
      setMedicines(medsRes.data?.results || medsRes.data || [])

      // Fetch medical records for each pharmacy visit
      if (visits.length > 0) {
        const recRes = await recordAPI.list()
        const allRecords = recRes.data?.results || recRes.data || []
        // Map records by visit id
        const visitIds = new Set(visits.map(v => v.id))
        setRecords(allRecords.filter(r => visitIds.has(r.visit)))
      }
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getRecordForVisit = (visitId) => records.find(r => r.visit === visitId)

  const handleDispense = async (visitId) => {
    setDispensing(true)
    try {
      // Mark visit as billing
      const { visitAPI: vApi } = await import('../utils/api')
      await (await import('../utils/api')).visitAPI.updateStatus(visitId, 'billing')
      setSuccess('Medicines dispensed. Patient sent to billing.')
      setSelected(null)
      fetchData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setDispensing(false)
    }
  }

  // Parse prescription text into lines for display
  const parsePrescriptions = (text) =>
    (text || '').split('\n').filter(l => l.trim()).map((l, i) => ({ id: i, line: l.trim() }))

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-clipboard2-pulse me-2 text-primary"></i>Pharmacy</h4>
          <p>Prescription queue and medicine dispensing</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="afya-badge yellow">
            <i className="bi bi-clock"></i> {queue.length} Pending Dispensing
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}
      {error   && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : queue.length === 0 ? (
        <div className="afya-card text-center py-5">
          <i className="bi bi-check-circle" style={{ fontSize: 40, color: 'var(--afya-green)' }}></i>
          <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>
            Pharmacy queue is clear. No pending prescriptions. ✓
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {queue.map(visit => {
            const record = getRecordForVisit(visit.id)
            const prescriptions = parsePrescriptions(record?.prescriptions)
            const isSelected = selected?.id === visit.id

            return (
              <div className="col-12" key={visit.id}>
                <div className="afya-card" style={{
                  border: isSelected ? '2px solid var(--afya-primary)' : '1px solid var(--afya-border)'
                }}>
                  {/* Visit header */}
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: '#dbeafe', color: '#1d4ed8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 16, flexShrink: 0
                      }}>
                        {visit.patient_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{visit.patient_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>
                          Visit #{visit.id} · {visit.visit_type}
                          &nbsp;·&nbsp;
                          Dr. {visit.doctor_name || 'N/A'}
                          &nbsp;·&nbsp;
                          {new Date(visit.visit_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <span className="afya-badge teal">
                        <i className="bi bi-capsule"></i> {prescriptions.length} item{prescriptions.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        className={`btn btn-sm ${isSelected ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                        style={{ borderRadius: 8, fontSize: 12 }}
                        onClick={() => setSelected(isSelected ? null : visit)}
                      >
                        {isSelected ? 'Collapse' : 'View Prescription'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded prescription detail */}
                  {isSelected && (
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--afya-border)' }}>
                      {!record ? (
                        <div className="alert-afya error">
                          <i className="bi bi-exclamation-triangle"></i>
                          No medical record found for this visit.
                        </div>
                      ) : (
                        <>
                          {/* Diagnosis banner */}
                          <div style={{
                            background: '#f0f9ff', border: '1px solid #bae6fd',
                            borderRadius: 10, padding: '12px 16px', marginBottom: 16
                          }}>
                            <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, marginBottom: 2 }}>DIAGNOSIS</div>
                            <div style={{ fontWeight: 600 }}>{record.diagnosis}</div>
                            {record.secondary_diagnosis && (
                              <div style={{ fontSize: 13, color: 'var(--afya-text-muted)', marginTop: 2 }}>
                                + {record.secondary_diagnosis}
                              </div>
                            )}
                          </div>

                          {/* Prescription items */}
                          <div className="section-title">
                            <i className="bi bi-capsule"></i> Prescriptions
                          </div>
                          {prescriptions.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--afya-text-muted)' }}>No prescriptions recorded.</p>
                          ) : (
                            <div style={{ marginBottom: 16 }}>
                              {prescriptions.map((p, idx) => (
                                <div key={p.id} style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 12,
                                  padding: '10px 14px', borderRadius: 8,
                                  background: idx % 2 === 0 ? '#f8fafc' : 'white',
                                  border: '1px solid var(--afya-border)',
                                  marginBottom: 6
                                }}>
                                  <div style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'var(--afya-primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700, flexShrink: 0
                                  }}>
                                    {idx + 1}
                                  </div>
                                  <span style={{ fontFamily: 'monospace', fontSize: 13, paddingTop: 2 }}>
                                    {p.line}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Treatment notes */}
                          {record.treatment_plan && (
                            <div style={{ marginBottom: 16 }}>
                              <div className="section-title"><i className="bi bi-journal-text"></i> Treatment Plan</div>
                              <div style={{
                                background: '#f8fafc', borderRadius: 8, padding: '10px 14px',
                                fontSize: 13, border: '1px solid var(--afya-border)'
                              }}>
                                {record.treatment_plan}
                              </div>
                            </div>
                          )}

                          {/* Medicines availability check */}
                          <div className="section-title">
                            <i className="bi bi-box-seam"></i> Stock Check
                          </div>
                          <div className="row g-2 mb-4">
                            {medicines.filter(m => m.is_active).slice(0, 6).map(m => (
                              <div className="col-auto" key={m.id}>
                                <span className={`afya-badge ${m.is_low_stock ? 'red' : 'green'}`} style={{ fontSize: 11 }}>
                                  <i className={`bi ${m.is_low_stock ? 'bi-exclamation-triangle' : 'bi-check-circle'}`}></i>
                                  {m.name} {m.strength} ({m.stock_quantity})
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Dispense action */}
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-outline-secondary" onClick={() => setSelected(null)}>
                              Close
                            </button>
                            <button
                              className="btn btn-success d-flex align-items-center gap-2"
                              onClick={() => handleDispense(visit.id)}
                              disabled={dispensing}
                            >
                              {dispensing
                                ? <><span className="spinner-border spinner-border-sm"></span> Processing...</>
                                : <><i className="bi bi-bag-check"></i> Confirm Dispensed & Send to Billing</>
                              }
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}