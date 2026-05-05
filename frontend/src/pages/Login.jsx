import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const ROLES = ['Doctor', 'Nurse', 'Receptionist', 'Radiologist', 'Pharmacist', 'Cashier']

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post(`${API_URL}/auth/login/`, form)
      localStorage.setItem('access_token',  data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('role',          data.role)
      localStorage.setItem('full_name',     data.full_name)
      localStorage.setItem('user_id',       data.user_id)
      localStorage.setItem('username',      data.username)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'Login failed. Check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="afya-login-page">
      <div className="afya-login-card">

        {/* Logo */}
        <div className="afya-login-logo">🏥</div>

        {/* Heading */}
        <h2>AfyaMojav1</h2>
        <p className="subtitle">Hospital Management Information System</p>

        {/* Role pills */}
        <div className="afya-role-pills">
          {ROLES.map(r => (
            <span key={r} className="afya-role-pill">{r}</span>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="alert-afya error mb-3">
            <i className="bi bi-exclamation-circle"></i>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="afya-form-group">
            <label htmlFor="username">Username</label>
            <div className="afya-input-icon">
              <i className="bi bi-person"></i>
              <input
                id="username"
                name="username"
                type="text"
                className="afya-form-control"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="afya-form-group">
            <label htmlFor="password">Password</label>
            <div className="afya-input-icon" style={{ position: 'relative' }}>
              <i className="bi bi-lock"></i>
              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className="afya-form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--afya-text-muted)', cursor: 'pointer',
                  padding: 0, lineHeight: 1
                }}
                tabIndex={-1}
              >
                <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <label className="d-flex align-items-center gap-2" style={{ fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" className="form-check-input m-0" />
              Remember me
            </label>
            <a href="#" style={{ fontSize: 13, color: 'var(--afya-primary)', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>

          <button type="submit" className="afya-btn-primary" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm"></span> Signing in...</>
              : <><i className="bi bi-box-arrow-in-right"></i> Sign In</>
            }
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--afya-text-muted)' }}>
          © 2025 AfyaMoja Health Technologies &nbsp;·&nbsp; v1.0.0
        </p>
      </div>
    </div>
  )
}