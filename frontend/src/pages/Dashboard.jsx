import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, ArcElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, ArcElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler
)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ── Axios instance with JWT ───────────────────────────────────
const api = axios.create({ baseURL: API_URL })
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── Role-specific greeting ────────────────────────────────────
const ROLE_GREETING = {
  doctor:       'Good day, Doctor 👨‍⚕️',
  nurse:        'Good day, Nurse 👩‍⚕️',
  receptionist: 'Welcome back 🗂️',
  radiologist:  'Ready to read 🔬',
  pharmacist:   'Stock checked? 💊',
  cashier:      'Billing station 🧾',
  admin:        'System overview 🖥️',
}

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon, iconColor, value, label, trend, trendDir }) => (
  <div className="afya-stat-card">
    <div className={`afya-stat-icon ${iconColor}`}>
      <i className={`bi ${icon}`}></i>
    </div>
    <div>
      <div className="afya-stat-value">{value ?? <span className="placeholder col-4 bg-secondary"></span>}</div>
      <div className="afya-stat-label">{label}</div>
      {trend && (
        <div className={`afya-stat-trend ${trendDir}`}>
          <i className={`bi ${trendDir === 'up' ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`}></i> {trend}
        </div>
      )}
    </div>
  </div>
)

// ── Recent visit status badge ─────────────────────────────────
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

export default function Dashboard() {
  const role     = localStorage.getItem('role') || 'admin'
  const fullName = localStorage.getItem('full_name') || 'User'

  const [stats,        setStats]        = useState(null)
  const [recentVisits, setRecentVisits] = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, visitsRes] = await Promise.all([
          api.get('/dashboard/stats/'),
          api.get('/visits/?today=true'),
        ])
        setStats(statsRes.data)
        setRecentVisits(visitsRes.data?.results || visitsRes.data || [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Chart data ──────────────────────────────────────────────
  const visitTypeChart = {
    labels: ['OPD', 'IPD', 'Emergency', 'Follow-up'],
    datasets: [{
      label: 'Visits by Type',
      data: [
        stats?.visits_by_type?.OPD       || 0,
        stats?.visits_by_type?.IPD       || 0,
        stats?.visits_by_type?.EMERGENCY || 0,
        stats?.visits_by_type?.FOLLOWUP  || 0,
      ],
      backgroundColor: ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981'],
      borderRadius: 8,
      borderSkipped: false,
    }]
  }

  const claimsChart = {
    labels: ['SHA', 'AIR', 'BRITAM', 'JUBILEE', 'CASH', 'OTHER'],
    datasets: [{
      data: [
        stats?.claims_by_provider?.SHA      || 0,
        stats?.claims_by_provider?.AIR      || 0,
        stats?.claims_by_provider?.BRITAM   || 0,
        stats?.claims_by_provider?.JUBILEE  || 0,
        stats?.claims_by_provider?.CASH     || 0,
        stats?.claims_by_provider?.OTHER    || 0,
      ],
      backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#64748b','#ef4444'],
      borderWidth: 0,
      hoverOffset: 6,
    }]
  }

  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const visitTrendChart = {
    labels: weekLabels,
    datasets: [{
      label: 'Visits This Week',
      data: [12, 19, 15, 22, 18, 8, 5],   // placeholder — replace with real weekly data
      fill: true,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,.1)',
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 4,
    }]
  }

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: title !== 'doughnut' ? {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
    } : undefined,
  })

  return (
    <div>
      {/* ── Page header ──────────────────────────────── */}
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h4>{ROLE_GREETING[role] || 'Dashboard'}</h4>
          <p>{new Date().toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-download"></i> Export
          </button>
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-plus-lg"></i> New Visit
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-people-fill"       iconColor="blue"   value={stats?.total_patients}     label="Total Patients"    trend="+12 today" trendDir="up" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-calendar-check"    iconColor="green"  value={stats?.total_visits_today} label="Visits Today"      trend="+3 this hour" trendDir="up" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-activity"          iconColor="yellow" value={stats?.active_visits}      label="Active Visits"     />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-shield-exclamation" iconColor="red"   value={stats?.pending_claims}     label="Pending Claims"    />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-box-seam"          iconColor="purple" value={stats?.low_stock_medicines} label="Low Stock Items"  trend="Reorder needed" trendDir="down" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-heart-pulse"       iconColor="teal"   value="98%"                        label="Bed Occupancy"   />
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────── */}
      <div className="row g-3 mb-4">

        {/* Visit trend line chart */}
        <div className="col-12 col-lg-6">
          <div className="afya-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="section-title mb-0">
                <i className="bi bi-graph-up-arrow"></i> Weekly Visit Trend
              </div>
              <span className="afya-badge blue">This Week</span>
            </div>
            <div className="afya-chart-wrap">
              <Line data={visitTrendChart} options={chartOptions('line')} />
            </div>
          </div>
        </div>

        {/* Visits by type bar chart */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="afya-card h-100">
            <div className="section-title">
              <i className="bi bi-bar-chart"></i> Visits by Type
            </div>
            <div className="afya-chart-wrap">
              <Bar data={visitTypeChart} options={chartOptions('bar')} />
            </div>
          </div>
        </div>

        {/* Claims by provider doughnut */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="afya-card h-100">
            <div className="section-title">
              <i className="bi bi-pie-chart"></i> Claims by Provider
            </div>
            <div className="afya-chart-wrap" style={{ height: 200 }}>
              <Doughnut
                data={claimsChart}
                options={{
                  ...chartOptions('doughnut'),
                  cutout: '65%',
                  plugins: {
                    legend: {
                      display: true, position: 'bottom',
                      labels: { font: { size: 10 }, padding: 8, boxWidth: 10 }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent visits table ──────────────────────── */}
      <div className="afya-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="section-title mb-0">
            <i className="bi bi-list-ul"></i> Today's Visits
          </div>
          <a href="/visits" style={{ fontSize: 13, color: 'var(--afya-primary)', textDecoration: 'none' }}>
            View all <i className="bi bi-arrow-right"></i>
          </a>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary spinner-border-sm"></div>
            <p className="mt-2 text-muted" style={{ fontSize: 13 }}>Loading visits...</p>
          </div>
        ) : recentVisits.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x" style={{ fontSize: 36, color: 'var(--afya-text-muted)' }}></i>
            <p className="mt-2" style={{ fontSize: 13, color: 'var(--afya-text-muted)' }}>No visits recorded today</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="afya-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Visit Type</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.slice(0, 10).map((visit, i) => {
                  const badge = STATUS_BADGE[visit.status] || { cls: 'gray', label: visit.status }
                  return (
                    <tr key={visit.id}>
                      <td style={{ color: 'var(--afya-text-muted)', fontSize: 12 }}>#{visit.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{visit.patient_name}</div>
                      </td>
                      <td>
                        <span className="afya-badge gray">{visit.visit_type}</span>
                      </td>
                      <td style={{ color: 'var(--afya-text-muted)' }}>
                        {visit.doctor_name || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td>
                        <span className={`afya-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td style={{ color: 'var(--afya-text-muted)', fontSize: 12 }}>
                        {new Date(visit.visit_date).toLocaleTimeString('en-KE', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6 }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}