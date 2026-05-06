import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Patients       from './pages/Patients'
import Visits         from './pages/Visits'
import Triage         from './pages/Triage'
import MedicalRecords from './pages/MedicalRecords'
import Medicines      from './pages/Medicines'
import Pharmacy       from './pages/Pharmacy'
import Radiology      from './pages/Radiology'
import SHARecords     from './pages/SHARecords'
import Users          from './pages/Users'
import Navbar         from './components/Navbar'
import Sidebar        from './components/Sidebar'

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('access_token')
  const role  = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role) && role !== 'admin')
    return <Navigate to="/dashboard" replace />
  return children
}

const AppLayout = ({ children }) => (
  <div className="afya-layout">
    <Sidebar />
    <div className="afya-main">
      <Navbar />
      <main className="afya-content">{children}</main>
    </div>
  </div>
)

const Page = ({ component: Component, roles }) => (
  <PrivateRoute allowedRoles={roles}>
    <AppLayout><Component /></AppLayout>
  </PrivateRoute>
)

const NotFound = () => (
  <div style={{
    minHeight:'100vh', display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    background:'var(--afya-bg)', textAlign:'center'
  }}>
    <div style={{ fontSize: 64 }}>🏥</div>
    <h2 style={{ fontSize:28, fontWeight:700, marginTop:12 }}>404 — Page Not Found</h2>
    <p style={{ color:'var(--afya-text-muted)', marginBottom:20 }}>This page doesn't exist in AfyaMojav1.</p>
    <a href="/dashboard" className="btn btn-primary">
      <i className="bi bi-grid me-2"></i>Back to Dashboard
    </a>
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* All authenticated */}
      <Route path="/"          element={<Page component={Dashboard} />} />
      <Route path="/dashboard" element={<Page component={Dashboard} />} />
      <Route path="/patients"  element={<Page component={Patients}  />} />
      <Route path="/visits"    element={<Page component={Visits}    />} />

      {/* Nurse */}
      <Route path="/triage" element={<Page component={Triage} roles={['nurse']} />} />

      {/* Doctor */}
      <Route path="/records" element={<Page component={MedicalRecords} roles={['doctor']} />} />

      {/* Pharmacist */}
      <Route path="/medicines" element={<Page component={Medicines} roles={['pharmacist','doctor','nurse']} />} />
      <Route path="/pharmacy"  element={<Page component={Pharmacy}  roles={['pharmacist']} />} />

      {/* Radiologist */}
      <Route path="/radiology"       element={<Page component={Radiology} roles={['radiologist']} />} />
      <Route path="/radiology-queue" element={<Page component={Radiology} roles={['radiologist']} />} />

      {/* Cashier / Receptionist */}
      <Route path="/sha-records" element={<Page component={SHARecords} roles={['cashier','receptionist']} />} />
      <Route path="/billing"     element={<Page component={SHARecords} roles={['cashier']} />} />

      {/* Admin */}
      <Route path="/users" element={<Page component={Users} roles={['admin']} />} />

      {/* Aliases */}
      <Route path="/register-patient" element={<Page component={Patients} />} />
      <Route path="/new-visit"        element={<Page component={Visits}   />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}