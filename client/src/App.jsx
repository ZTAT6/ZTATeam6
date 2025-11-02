import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import './App.css'

function saveAuth(token, role) {
  localStorage.setItem('token', token)
  localStorage.setItem('role', role)
}
function getAuth() {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
  }
}
function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const res = await fetch(path, { ...opts, headers })
  const contentType = res.headers.get('content-type') || ''
  const json = contentType.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) throw { status: res.status, data: json }
  return json
}

function decodeRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role
  } catch (e) {
    return null
  }
}

function Protected({ allow, children }) {
  const { token, role } = getAuth()
  if (!token) return <Navigate to="/" replace />
  if (allow && !allow.includes(role)) return <Navigate to={`/${role || 'dashboard'}`} replace />
  return children
}

function LoginPage() {
  const nav = useNavigate()
  const [tab, setTab] = useState('login')
  async function onLogin(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const username = form.get('username')
    const password = form.get('password')
    try {
      const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      if (res.token && res.role) {
        saveAuth(res.token, res.role)
        nav(`/${res.role}`)
      } else if (res.challenge_id) {
        nav(`/confirm-login/${res.challenge_id}`)
      } else if (res.message) {
        alert(res.message)
      }
    } catch (err) {
      alert(err?.data?.error || 'Login failed')
    }
  }
  async function onSignup(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const username = form.get('username')
    const password = form.get('password')
    const email = form.get('email')
    try {
      const res = await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, email }) })
      alert(res.message || 'Signup successful. Check server logs for code.')
      nav('/verify')
    } catch (err) {
      alert(err?.data?.error || 'Signup failed')
    }
  }
  return (
    <div className="page">
      <div className="wrapper">
        <div className="title-track">
          <div className="title-inner" style={{ transform: tab === 'signup' ? 'translateX(-50%)' : 'translateX(0%)' }}>
            <h2 className="login">Login Form</h2>
            <h2>Signup Form</h2>
          </div>
        </div>
        <div className={"slide-controls " + (tab === 'signup' ? 'active' : '')}>
          <label className="login" onClick={() => setTab('login')}>Login</label>
          <label className="signup" onClick={() => setTab('signup')}>Signup</label>
        </div>
        <div className="form-container">
          <div className="form-inner" style={{ transform: tab === 'signup' ? 'translateX(-50%)' : 'translateX(0%)' }}>
            <form className="login" onSubmit={onLogin}>
              <div className="field">
                <input name="username" type="text" placeholder="Email or username" required />
              </div>
              <div className="field">
                <input name="password" type="password" placeholder="Password" required />
              </div>
              <div className="actions"><a className="link" href="#" onClick={(e)=>e.preventDefault()}>Forgot password?</a></div>
              <button className="btn" type="submit">Login</button>
            </form>
            <form className="signup" onSubmit={onSignup}>
              <div className="field">
                <input name="email" type="email" placeholder="Email address" required />
              </div>
              <div className="field">
                <input name="password" type="password" placeholder="Password" required />
              </div>
              <div className="field">
                <input name="username" type="text" placeholder="Username (optional if same as email)" required />
              </div>
              <button className="btn" type="submit">Signup</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifyPage() {
  async function onVerify(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    const code = form.get('code')
    try {
      const res = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) })
      alert('Verified! You can now log in.')
    } catch (err) {
      alert(err?.data?.error || 'Verification failed')
    }
  }
  return (
    <div style={{ maxWidth: 420, margin: '2rem auto', textAlign: 'left' }}>
      <h2>Verify Email</h2>
      <form onSubmit={onVerify} style={{ display: 'grid', gap: 8 }}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="code" placeholder="Verification code" required />
        <button type="submit">Verify</button>
      </form>
    </div>
  )
}

function TopBar() {
  const { role } = getAuth()
  const nav = useNavigate()
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #ddd' }}>
      <div>Role: {role || 'unknown'}</div>
      <button onClick={() => { logout(); nav('/') }}>Logout</button>
    </div>
  )
}

function ActivityList({ items }) {
  return (
    <ul>
      {items.map((it) => (
        <li key={`${it._id}`}>{it.timestamp} — {it.action} {it.target ? `on ${it.target}` : ''}</li>
      ))}
    </ul>
  )
}

function TeacherPage() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    fetch('/me/activity?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).catch(() => {})
  }, [])
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <TopBar />
      <h2>Teacher Dashboard</h2>
      <h3>My Activity</h3>
      <ActivityList items={items} />
    </div>
  )
}

function StudentPage() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    fetch('/me/activity?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).catch(() => {})
  }, [])
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <TopBar />
      <h2>Student Dashboard</h2>
      <h3>My Activity</h3>
      <ActivityList items={items} />
    </div>
  )
}

function AdminPage() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    fetch('/admin/activity?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).catch(() => {})
  }, [])
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <TopBar />
      <h2>Admin Dashboard</h2>
      <h3>Recent Activity</h3>
      <ActivityList items={items} />
    </div>
  )
}

function ConfirmLoginPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [status, setStatus] = useState('Waiting for confirmation...')

  useEffect(() => {
    let active = true
    const t = setInterval(async () => {
      try {
        const res = await api(`/auth/challenge-status?id=${encodeURIComponent(id)}`)
        if (!active) return
        if (res.approved && res.token) {
          const role = decodeRoleFromToken(res.token) || 'dashboard'
          saveAuth(res.token, role)
          clearInterval(t)
          setStatus('Confirmed! Redirecting...')
          nav(`/${role}`)
        }
      } catch (e) {
        // ignore transient errors
      }
    }, 2000)
    return () => { active = false; clearInterval(t) }
  }, [id, nav])

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto' }}>
      <h2>Confirm Login</h2>
      <p>{status}</p>
      <p>If email is not configured, approve using the dev link printed in the server terminal.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/confirm-login/:id" element={<ConfirmLoginPage />} />
        <Route path="/teacher" element={<Protected allow={["teacher","admin"]}><TeacherPage /></Protected>} />
        <Route path="/student" element={<Protected allow={["student","admin"]}><StudentPage /></Protected>} />
        <Route path="/admin" element={<Protected allow={["admin"]}><AdminPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
