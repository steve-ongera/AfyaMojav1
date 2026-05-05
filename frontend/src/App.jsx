import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// ── Auth guard ────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" replace />
}

// ── Layout wrapper (Navbar + Sidebar + content) ───────────────
import Navbar  from './components/Navbar'
import Sidebar from './components/Sidebar'

const AppLayout = ({ children }) => (
  <div className="afya-layout">
    <Sidebar />
    <div className="afya-main">
      <Navbar />
      <main className="afya-content">
        {children}
      </main>
    </div>
  </div>
)

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}