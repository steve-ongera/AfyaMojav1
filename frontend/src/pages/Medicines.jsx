import React, { useEffect, useState, useCallback } from 'react'
import { medicineAPI, getErrorMessage } from '../utils/api'

const DOSAGE_FORMS = ['tablet','capsule','syrup','injection','cream','drops','inhaler','suppository','patch','other']

const EMPTY_FORM = {
  name: '', generic_name: '', dosage_form: 'tablet',
  strength: '', stock_quantity: 0, reorder_level: 10,
  unit_price: '', is_active: true,
}

export default function Medicines() {
  const role = localStorage.getItem('role')

  const [medicines,   setMedicines]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [lowOnly,     setLowOnly]     = useState(false)
  const [showModal,   setShowModal]   = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [stockModal,  setStockModal]  = useState(null)
  const [stockQty,    setStockQty]    = useState(0)

  const fetchMedicines = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)  params.search    = search
      if (lowOnly) params.low_stock = 'true'
      const { data } = await medicineAPI.list(params)
      setMedicines(data?.results || data || [])
    } catch (e) { setError(getErrorMessage(e)) }
    finally     { setLoading(false) }
  }, [search, lowOnly])

  useEffect(() => { fetchMedicines() }, [fetchMedicines])

  useEffect(() => {
    const t = setTimeout(fetchMedicines, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  const openEdit = (med) => {
    setEditItem(med)
    setForm({
      name: med.name, generic_name: med.generic_name,
      dosage_form: med.dosage_form, strength: med.strength,
      stock_quantity: med.stock_quantity, reorder_level: med.reorder_level,
      unit_price: med.unit_price, is_active: med.is_active,
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (editItem) {
        await medicineAPI.update(editItem.id, form)
        setSuccess('Medicine updated successfully.')
      } else {
        await medicineAPI.create(form)
        setSuccess('Medicine added to formulary.')
      }
      setShowModal(false)
      fetchMedicines()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) { setError(getErrorMessage(e)) }
    finally     { setSaving(false) }
  }

  const handleStockUpdate = async () => {
    try {
      await medicineAPI.update(stockModal.id, { stock_quantity: parseInt(stockQty) })
      setSuccess(`Stock updated for ${stockModal.name}.`)
      setStockModal(null)
      fetchMedicines()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) { alert(getErrorMessage(e)) }
  }

  const totalValue = medicines.reduce((sum, m) => sum + (parseFloat(m.unit_price) * m.stock_quantity), 0)
  const lowCount   = medicines.filter(m => m.is_low_stock).length

  return (
    <div>
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4><i className="bi bi-capsule me-2 text-primary"></i>Medicines</h4>
          <p>Formulary management and stock control</p>
        </div>
        {['pharmacist','admin'].includes(role) && (
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> Add Medicine
          </button>
        )}
      </div>

      {success && <div className="alert-afya success mb-3"><i className="bi bi-check-circle"></i> {success}</div>}

      {/* Summary cards */}
      <div className="row g-3 mb-3">
        {[
          { icon: 'bi-capsule',            color: 'blue',   value: medicines.length,          label: 'Total Items' },
          { icon: 'bi-exclamation-triangle',color: 'red',   value: lowCount,                  label: 'Low Stock Items' },
          { icon: 'bi-currency-dollar',    color: 'green',  value: `KES ${totalValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}`, label: 'Total Stock Value' },
        ].map(({ icon, color, value, label }) => (
          <div className="col-6 col-md-4" key={label}>
            <div className="afya-stat-card">
              <div className={`afya-stat-icon ${color}`}><i className={`bi ${icon}`}></i></div>
              <div>
                <div className="afya-stat-value" style={{ fontSize: 22 }}>{value}</div>
                <div className="afya-stat-label">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="afya-card mb-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="afya-input-icon">
              <i className="bi bi-search"></i>
              <input className="afya-form-control" placeholder="Search by name or generic name..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-auto">
            <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" className="form-check-input m-0"
                checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} />
              Show low stock only
            </label>
          </div>
          <div className="col-auto ms-auto">
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchMedicines}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="afya-card p-0">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-capsule" style={{ fontSize: 40, color: 'var(--afya-text-muted)' }}></i>
            <p className="mt-2" style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>No medicines found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="afya-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Generic Name</th>
                  <th>Form</th>
                  <th>Strength</th>
                  <th>Stock</th>
                  <th>Reorder</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, i) => (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--afya-text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--afya-text-muted)' }}>{m.generic_name || '—'}</td>
                    <td>
                      <span className="afya-badge gray" style={{ textTransform: 'capitalize' }}>{m.dosage_form}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{m.strength}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: 15,
                        color: m.is_low_stock ? 'var(--afya-red)' : 'var(--afya-green)'
                      }}>
                        {m.stock_quantity}
                      </span>
                      {m.is_low_stock && (
                        <i className="bi bi-exclamation-triangle-fill text-danger ms-1" style={{ fontSize: 12 }}></i>
                      )}
                    </td>
                    <td style={{ color: 'var(--afya-text-muted)', fontSize: 13 }}>{m.reorder_level}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      KES {parseFloat(m.unit_price).toFixed(2)}
                    </td>
                    <td>
                      <span className={`afya-badge ${m.is_active ? 'green' : 'gray'}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {['pharmacist','admin'].includes(role) && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                              title="Update Stock"
                              onClick={() => { setStockModal(m); setStockQty(m.stock_quantity) }}
                            >
                              <i className="bi bi-box-seam"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                              title="Edit"
                              onClick={() => openEdit(m)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Medicine Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-capsule text-primary me-2"></i>
                  {editItem ? 'Edit Medicine' : 'Add Medicine'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                {error && <div className="alert-afya error mb-3"><i className="bi bi-exclamation-circle"></i> {error}</div>}
                <form id="medicine-form" onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Brand Name *</label>
                      <input name="name" className="afya-form-control" required
                        value={form.name} onChange={handleChange} placeholder="e.g. Amoxil" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Generic Name</label>
                      <input name="generic_name" className="afya-form-control"
                        value={form.generic_name} onChange={handleChange} placeholder="e.g. Amoxicillin" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Dosage Form *</label>
                      <select name="dosage_form" className="afya-form-control" value={form.dosage_form} onChange={handleChange}>
                        {DOSAGE_FORMS.map(f => (
                          <option key={f} value={f} style={{ textTransform: 'capitalize' }}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Strength *</label>
                      <input name="strength" className="afya-form-control" required
                        value={form.strength} onChange={handleChange} placeholder="e.g. 500mg" />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Stock Qty</label>
                      <input name="stock_quantity" type="number" min="0" className="afya-form-control"
                        value={form.stock_quantity} onChange={handleChange} />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Reorder Level</label>
                      <input name="reorder_level" type="number" min="0" className="afya-form-control"
                        value={form.reorder_level} onChange={handleChange} />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Unit Price (KES)</label>
                      <input name="unit_price" type="number" step="0.01" min="0" className="afya-form-control"
                        value={form.unit_price} onChange={handleChange} placeholder="0.00" />
                    </div>
                    <div className="col-12">
                      <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" name="is_active" className="form-check-input m-0"
                          checked={form.is_active} onChange={handleChange} />
                        Active in formulary
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" form="medicine-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm"></span> Saving...</>
                    : <><i className="bi bi-check-lg"></i> {editItem ? 'Update' : 'Add Medicine'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Update Modal */}
      {stockModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0" style={{ padding: '20px 24px 0' }}>
                <h5 className="modal-title fw-bold" style={{ fontSize: 15 }}>
                  <i className="bi bi-box-seam text-primary me-2"></i>Update Stock
                </h5>
                <button className="btn-close" onClick={() => setStockModal(null)}></button>
              </div>
              <div className="modal-body" style={{ padding: '16px 24px' }}>
                <p style={{ fontSize: 13, color: 'var(--afya-text-muted)', marginBottom: 12 }}>
                  {stockModal.name} {stockModal.strength}
                </p>
                <label className="form-label fw-semibold" style={{ fontSize: 12 }}>New Stock Quantity</label>
                <input type="number" min="0" className="afya-form-control"
                  value={stockQty} onChange={e => setStockQty(e.target.value)} />
              </div>
              <div className="modal-footer border-0" style={{ padding: '0 24px 20px' }}>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setStockModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleStockUpdate}>
                  <i className="bi bi-check-lg me-1"></i>Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}