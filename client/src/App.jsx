import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import OtpInput from './components/OtpInput'
import PasswordStrength, { scorePassword } from './components/PasswordStrength'
import Home from './pages/Home'
import About from './pages/About'
import Courses from './pages/Courses'
import { I18nProvider, useI18n } from './i18n.jsx'

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
  const { t, lang, setLang } = useI18n()
  const [tab, setTab] = useState('login')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/health/db')
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (json?.status === 'ok' && json?.db?.pingOk) {
          setBackendStatus('ok')
        } else {
          setBackendStatus('fail')
        }
      } catch {
        if (active) setBackendStatus('fail')
      }
    })()
    return () => { active = false }
  }, [])
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
    const confirm = form.get('confirm_password')
    const s = scorePassword(password)
    if (password !== confirm) return alert('Passwords do not match')
    if (s.score < 4) return alert('Password too weak. Use upper, lower, digit, symbol and 8+ chars.')
    const email = form.get('email')
    try {
      const body = { username: username || email, password, email, channel: 'email' }
      const res = await api('/auth/register', { method: 'POST', body: JSON.stringify(body) })
      const ident = email
      try { localStorage.setItem('pending_identifier', ident); localStorage.setItem('pending_channel', 'email') } catch {}
      alert(res.message || 'Signup successful. Check your email for the code.')
      nav('/verify')
    } catch (err) {
      alert(err?.data?.error || 'Signup failed')
    }
  }
  return (
    <div className="page auth">
      <div className="wrapper">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 800, color: '#0a4ea8' }}>{t('brand')}</div>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <a className="back-link" href="#" onClick={(e)=>{e.preventDefault(); nav('/home')}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="#0a4ea8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t('backHome')}</span>
            </a>
            <label style={{ color:'#666' }}>{t('lang_label')}:</label>
            <select value={lang} onChange={(e)=>setLang(e.target.value)}>
              <option value="vi">VI</option>
              <option value="en">EN</option>
            </select>
            <span style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 999, fontSize: 12, background: backendStatus==='ok'?'#e8f5e9':'#fdecea', color: backendStatus==='ok'?'#1b5e20':'#b71c1c', border: '1px solid '+(backendStatus==='ok'?'#c8e6c9':'#f5c6cb') }}>
              Backend: {backendStatus==='checking'?'checking...':backendStatus==='ok'?'OK':'Fail'}
            </span>
          </div>
        </div>
        <div className="title-track">
          <div className="title-inner" style={{ transform: tab === 'signup' ? 'translateX(-50%)' : 'translateX(0%)' }}>
            <h2 className="login">{t('login')}</h2>
            <h2>{t('signup')}</h2>
          </div>
        </div>
        <div className={"slide-controls " + (tab === 'signup' ? 'active' : '')}>
          <label className="login" onClick={() => setTab('login')}>{t('login')}</label>
          <label className="signup" onClick={() => setTab('signup')}>{t('signup')}</label>
        </div>
        <div className="form-container">
          <div className="form-inner" style={{ transform: tab === 'signup' ? 'translateX(-50%)' : 'translateX(0%)' }}>
            <form className="login" onSubmit={onLogin}>
              <div className="field">
                <input name="username" type="text" placeholder={t('emailOrUsername')} required />
              </div>
              <div className="field">
                <input name="password" type="password" placeholder={t('password')} required />
              </div>
              <div className="actions"><a className="link" href="#" onClick={(e)=>{e.preventDefault(); nav('/forgot')}}>{t('forgotPasswordQ')}</a></div>
              <button className="btn" type="submit">{t('login')}</button>
            </form>
            <form className="signup" onSubmit={onSignup}>
              <div className="field">
                <input name="email" type="email" placeholder={t('emailAddress')} required />
              </div>
              <div className="field">
                <input name="password" type="password" placeholder={t('password')} value={signupPassword} onChange={(e)=>setSignupPassword(e.target.value)} required />
                <PasswordStrength password={signupPassword} />
              </div>
              <div className="field">
                <input name="username" type="text" placeholder={t('usernameOptional')} />
              </div>
              <div className="field">
                <input name="confirm_password" type="password" placeholder={t('confirmPassword')} value={signupConfirm} onChange={(e)=>setSignupConfirm(e.target.value)} required />
              </div>
              <button className="btn" type="submit">{t('signup')}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifyPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const nav = useNavigate()
  const { t } = useI18n()
  useEffect(() => {
    try {
      const ident = localStorage.getItem('pending_identifier') || ''
      if (ident) setEmail(ident)
    } catch {}
  }, [])

  async function onResend() {
    try {
      const res = await api('/auth/resend-code', { method: 'POST', body: JSON.stringify({ email }) })
      alert(res.message || 'Verification code sent')
    } catch (err) {
      alert(err?.data?.error || 'Resend failed')
    }
  }
  async function onConfirm(e) {
    e.preventDefault()
    try {
      const res = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) })
      alert(res.message || 'Verified! You can now log in.')
      nav('/login')
    } catch (err) {
      alert(err?.data?.error || 'Verification failed')
    }
  }

  return (
    <div className="page">
      <div className="wrapper" style={{ maxWidth: 600 }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>{t('verifyEmailTitle')}</h2>
        <form onSubmit={onConfirm}>
          <div className="field">
            <input type="email" placeholder={t('emailAddress')} value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label style={{ display: 'block', marginBottom: 6 }}>Enter verification code</label>
            <OtpInput value={code} onChange={setCode} />
          </div>
          <div className="actions-row">
            <button type="button" onClick={onResend}>{t('resendCode')}</button>
            <button type="submit">{t('confirm')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TopBar() {
  const { role } = getAuth()
  const nav = useNavigate()
  const { t } = useI18n()
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #ddd' }}>
      <div>Role: {role || 'unknown'}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => nav('/home')}>{t('backHome')}</button>
        <button onClick={() => { logout(); nav('/home') }}>Logout</button>
      </div>
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
  const [profile, setProfile] = useState(null)
  const [courses] = useState([
    { title: 'Toán cơ bản', code: 'MATH101', progress: 0.6 },
    { title: 'Văn học Việt Nam', code: 'LIT201', progress: 0.35 },
    { title: 'Vật lý đại cương', code: 'PHYS110', progress: 0.8 },
  ])
  const [stats] = useState({ gpa: 3.6, credits: 12, pending: 2 })
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    fetch('/me/activity?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).catch(() => {})
    fetch('/me/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setProfile).catch(() => {})
  }, [])
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <TopBar />
      <h2>Student Dashboard</h2>

      {/* Profile card */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 14px', border: '1px solid #e1e5eb', borderRadius: 12, margin: '16px 0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Hồ sơ</div>
          <div>Tên: {profile?.full_name || '—'}</div>
          <div>Email: {profile?.email || '—'}</div>
          <div>Username: {profile?.username || '—'}</div>
        </div>
      </div>

      {/* My Courses */}
      <div style={{ padding: '12px 14px', border: '1px solid #e1e5eb', borderRadius: 12, margin: '16px 0' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Khoá học của tôi</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {courses.map(c => (
            <div key={c.code} style={{ border: '1px solid #eef2ff', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontWeight: 600 }}>{c.title} <span style={{ color: '#666', fontWeight: 400 }}>({c.code})</span></div>
              <div style={{ height: 8, background: '#eef2ff', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(c.progress * 100)}%`, height: '100%', background: '#0c61cf' }} />
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Tiến độ: {Math.round(c.progress * 100)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade stats */}
      <div style={{ padding: '12px 14px', border: '1px solid #e1e5eb', borderRadius: 12, margin: '16px 0' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Thống kê điểm số</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: '#f7faff', border: '1px solid #eef2ff', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, color: '#666' }}>GPA</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.gpa}</div>
          </div>
          <div style={{ flex: 1, background: '#f7faff', border: '1px solid #eef2ff', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Tín chỉ đã hoàn thành</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.credits}</div>
          </div>
          <div style={{ flex: 1, background: '#f7faff', border: '1px solid #eef2ff', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Khoá học đang chờ</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.pending}</div>
          </div>
        </div>
      </div>

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

function ForgotPasswordPage() {
  const nav = useNavigate()
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const otpRef = React.useRef(null)
  async function onReset(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const identifier = resetEmail || form.get('identifier')
    const code = resetCode
    const new_password = newPassword
    if (new_password !== confirmPassword) return alert('Passwords do not match')
    const s = scorePassword(new_password)
    if (s.score < 4) return alert('Password too weak. Use upper, lower, digit, symbol and 8+ chars.')
    try {
      const res = await api('/auth/forgot-password/reset', { method: 'POST', body: JSON.stringify({ identifier, code, new_password }) })
      alert(res.message || 'Password updated. You can now log in.')
      nav('/login')
    } catch (err) {
      alert(err?.data?.error || 'Password reset failed')
    }
  }
  async function onResendReset(e) {
    e.preventDefault()
    const identifier = resetEmail
    if (!identifier) return alert('Please enter your email above first')
    try {
      const res = await api('/auth/forgot-password/request', { method: 'POST', body: JSON.stringify({ identifier }) })
      alert(res.message || 'Reset code sent')
      otpRef.current?.focusFirst?.()
    } catch (err) {
      alert(err?.data?.error || 'Resend failed')
    }
  }
  return (
    <div className="page">
      <div className="wrapper" style={{ maxWidth: 600 }}>
        <h2 style={{ textAlign: 'center' }}>Forgot Password</h2>
        {/* Enter code and set new password */}
        <form onSubmit={onReset} style={{ width: '100%' }}>
          <div className="field">
            <input name="identifier" type="text" placeholder="Email" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label style={{ display: 'block', marginBottom: 6 }}>Enter verification code</label>
            <OtpInput ref={otpRef} value={resetCode} onChange={setResetCode} />
          </div>
          <div className="field">
            <input name="new_password" type="password" placeholder="New password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required />
            <PasswordStrength password={newPassword} />
          </div>
          <div className="field">
            <input name="confirm_new_password" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
          </div>
          <div className="actions-row">
            <button type="button" onClick={onResendReset}>Resend Code</button>
            <button type="submit" disabled={scorePassword(newPassword).score < 4 || newPassword !== confirmPassword}>Reset Password</button>
          </div>
        </form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a href="#" onClick={(e)=>{e.preventDefault(); nav('/login')}}>Back to Login</a>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route path="/confirm-login/:id" element={<ConfirmLoginPage />} />
          <Route path="/teacher" element={<Protected allow={["teacher","admin"]}><TeacherPage /></Protected>} />
          <Route path="/student" element={<Protected allow={["student","admin"]}><StudentPage /></Protected>} />
          <Route path="/admin" element={<Protected allow={["admin"]}><AdminPage /></Protected>} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
