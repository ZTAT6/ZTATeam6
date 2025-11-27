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
  } catch {
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
      } else if (res.challengeId) {
        nav(`/confirm-login/${encodeURIComponent(res.challengeId)}`)
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
      try { localStorage.setItem('pending_identifier', ident); localStorage.setItem('pending_channel', 'email') } catch { void 0 }
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
    } catch { void 0 }
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
      alert(res.message || 'Xác thực email thành công. Tài khoản sẽ được kích hoạt sau khi admin duyệt.')
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
  const list = Array.isArray(items) ? items : []
  function friendly(method, path) {
    if (path.startsWith('/admin/users/teachers') && method==='GET') return 'Xem danh sách giáo viên'
    if (path.startsWith('/admin/users/students') && method==='GET') return 'Xem danh sách học viên'
    if (path.startsWith('/admin/users/') && method==='PATCH' && path.includes('/status')) return 'Đổi trạng thái người dùng'
    if (path.startsWith('/admin/users/teacher') && method==='POST') return 'Tạo giáo viên'
    if (path.startsWith('/admin/courses') && method==='GET') return 'Xem khoá học'
    if (path.startsWith('/admin/courses') && method==='POST') return 'Tạo khoá học'
    if (path.startsWith('/admin/classes') && method==='GET') return 'Xem lớp'
    if (path.startsWith('/admin/classes') && method==='POST') return 'Tạo lớp'
    if (path.startsWith('/admin/classes/') && method==='PATCH' && path.includes('/regenerate-code')) return 'Đổi mã lớp'
    if (path.startsWith('/admin/enrollments') && method==='GET') return 'Xem ghi danh'
    if (path.startsWith('/admin/activity') && method==='GET') return 'Xem hoạt động'
    return `${method} ${path}`
  }
  return (
    <ul className="activity-list">
      {list.map((it) => {
        const user = typeof it.user_id === 'object' ? (it.user_id.full_name || it.user_id.username || it.user_id.role || '') : (it.user_id || '')
        const ts = it.timestamp ? new Date(it.timestamp).toLocaleString() : ''
        const status = it.status ? String(it.status) : ''
        const ip = it.ip_address || ''
        const device = it.device_info || ''
        const [m,p] = String(it.action||'').split(' ')
        const act = friendly(m||'', p||'')
        const target = it.target_name || ''
        const resource = it.resource || ''
        const sNum = parseInt(status || '0', 10)
        const sClass = isNaN(sNum) ? '' : (sNum >= 500 ? 'http-error' : (sNum >= 400 ? 'http-warn' : 'http-ok'))
        return (
          <li className="activity-item" key={`${it._id || it.timestamp || Math.random()}`}>
            <span className="time">{ts}</span>
            <span className="action" style={{ fontWeight: 600 }}>{act}</span>
            {target ? <span className="target">{` ${target}`}</span> : null}
            {status ? <span style={{ marginLeft: 8 }} className={`status-badge ${sClass}`}>{status}</span> : null}
            {resource ? <span style={{ marginLeft: 8, color:'#6b7280', fontSize:12 }}>{resource}</span> : null}
            {user ? <span style={{ marginLeft: 12 }}>{user}</span> : null}
            {ip ? <span style={{ marginLeft: 12 }}>{ip}</span> : null}
            {device ? <span style={{ marginLeft: 12, color: '#666' }}>{device.slice(0, 40)}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}

function TeacherPage() {
  const [items, setItems] = useState([])
  const [myCourses, setMyCourses] = useState([])
  const [myClasses, setMyClasses] = useState([])
  const [profile, setProfile] = useState(null)
  const [trusted, setTrusted] = useState(true)
  const [creatingClass, setCreatingClass] = useState(false)
  const [classForm, setClassForm] = useState({ name: '', course_id: '' })
  const [classErrors, setClassErrors] = useState({})
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    fetch('/me/activity?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setItems).catch(() => {})
    fetch('/me/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setProfile).catch(() => {})
    fetch('/me/trust-status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(d=>setTrusted(!!d?.trusted || !!d?.internalIp)).catch(()=>{})
    fetch('/teacher/courses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setMyCourses).catch(() => {})
    fetch('/teacher/classes', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setMyClasses).catch(() => {})
  }, [])
  function validateClassForm(f) {
    const e = {}
    if (!f.name || f.name.trim().length < 1) e.name = 'Tên lớp không được để trống'
    if (!f.course_id || !/^[0-9a-fA-F]{24}$/.test(f.course_id)) e.course_id = 'Khoá học không hợp lệ'
    return e
  }
  async function onCreateClass(e) {
    e.preventDefault()
    const vErrors = validateClassForm(classForm)
    if (Object.keys(vErrors).length) { setClassErrors(vErrors); return }
    setCreatingClass(true)
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const payload = { name: classForm.name, course_id: classForm.course_id }
      const res = await fetch('/teacher/classes', { method:'POST', headers: hdr, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Create failed')
      fetch('/teacher/classes', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setMyClasses).catch(()=>{})
      alert('Đã tạo lớp')
      setClassForm({ name:'', course_id:'' })
      setClassErrors({})
    } catch (err) {
      alert(err.message || 'Create class failed')
    } finally { setCreatingClass(false) }
  }
  async function onUpdateClassStatus(classId, nextStatus) {
    if (!classId || !nextStatus) return
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch(`/teacher/classes/${encodeURIComponent(classId)}`, { method:'PATCH', headers: hdr, body: JSON.stringify({ status: nextStatus }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Update failed')
      setMyClasses(prev => Array.isArray(prev) ? prev.map(c => (c._id === classId ? { ...c, status: nextStatus } : c)) : prev)
    } catch (err) {
      alert(err.message || 'Update status failed')
    }
  }
  async function onRegenerateClassCode(classId) {
    if (!classId) return
    try {
      const { token } = getAuth()
      const hdr = { Authorization: `Bearer ${token}` }
      const res = await fetch(`/teacher/classes/${encodeURIComponent(classId)}/regenerate-code`, { method:'PATCH', headers: hdr })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Regenerate failed')
      setMyClasses(prev => Array.isArray(prev) ? prev.map(c => (c._id === classId ? { ...c, join_code: json.join_code } : c)) : prev)
    } catch (err) {
      alert(err.message || 'Regenerate code failed')
    }
  }
  async function onCopyJoinCode(code) {
    try {
      if (!code) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
        alert('Đã copy mã lớp')
      } else {
        const ta = document.createElement('textarea')
        ta.value = code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        alert('Đã copy mã lớp')
      }
    } catch {
      alert('Copy thất bại')
    }
  }
  return (
    <div className="teacher-page">
      <TopBar />

      <section className="teacher-hero">
        <div className="avatar" />
        <div className="hero-info">
          <h1>Xin chào, {profile?.full_name || profile?.username || 'Giáo viên'}</h1>
          <div className="hero-meta">
            <span className="role-badge">Teacher</span>
            <span className="email">{profile?.email || '—'}</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card"><div className="label">Khoá học</div><div className="value">{Array.isArray(myCourses)?myCourses.length:0}</div></div>
          <div className="stat-card"><div className="label">Lớp</div><div className="value">{Array.isArray(myClasses)?myClasses.length:0}</div></div>
          <div className="stat-card"><div className="label">Đang hoạt động</div><div className="value">{Array.isArray(myClasses)?myClasses.filter(c=>c.status==='active').length:0}</div></div>
        </div>
      </section>

      <section className="teacher-section">
        <div className="section-head"><h2>Quản lý lớp</h2></div>
        <div className="panel">
          <h3 className="panel-title">Tạo lớp</h3>
          <form className="stack-form" onSubmit={onCreateClass} aria-label="Tạo lớp">
            <div className="field">
              <label>Tên lớp</label>
              <input type="text" placeholder="Nhập tên lớp" value={classForm.name} required aria-invalid={!!classErrors.name} onChange={e=>{ setClassForm({ ...classForm, name: e.target.value }); if (classErrors.name) setClassErrors({ ...classErrors, name: undefined }) }} />
              {classErrors.name && <div className="form-error">{classErrors.name}</div>}
            </div>
            <div className="field">
              <select value={classForm.course_id} onChange={e=>{ setClassForm({ ...classForm, course_id: e.target.value }); if (classErrors.course_id) setClassErrors({ ...classErrors, course_id: undefined }) }}>
                <option value="">Chọn khoá học của tôi</option>
                {(Array.isArray(myCourses)?myCourses:[]).map(c => (
                  <option key={c._id||c.id} value={c._id||c.id}>{c.title}</option>
                ))}
              </select>
              {classErrors.course_id && <div className="form-error">{classErrors.course_id}</div>}
            </div>
            <button className="btn" disabled={creatingClass || !trusted} type="submit">{creatingClass? 'Đang tạo...' : 'Tạo lớp'}</button>
          </form>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3 className="panel-title">Danh sách lớp của tôi</h3>
          <div className="cards-grid">
            {(Array.isArray(myClasses)?myClasses:[]).map((cl,i)=> (
              <div key={cl._id||i} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <div className="title">{cl.name}</div>
                  <span className={`status-badge ${cl.status}`}>{cl.status}</span>
                </div>
                <div className="meta">Khoá: {cl.course_id}</div>
                <div className="meta">Mã lớp: {cl.join_code || '—'}</div>
                <div className="meta">Tạo: {new Date(cl.created_at).toLocaleString()}</div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <button className="btn" type="button" onClick={()=>onCopyJoinCode(cl.join_code)}>Copy mã</button>
                  <button className="btn" disabled={!trusted} type="button" onClick={()=>onRegenerateClassCode(cl._id)}>Đổi mã</button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <select defaultValue={cl.status} disabled={!trusted} onChange={(e)=>onUpdateClassStatus(cl._id, e.target.value)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="blocked">blocked</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!trusted && (
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="form-error">Thiết bị chưa tin cậy — đang ở chế độ chỉ xem. Vui lòng xác nhận đăng nhập qua email để bật quyền sửa.</div>
        </div>
      )}

      <div className="activity-section" style={{ marginTop: 18 }}>
        <div className="section-head"><h2>Hoạt động gần đây</h2></div>
        <ActivityList items={items} />
      </div>
    </div>
  )
}

function StudentPage() {
  const [profile, setProfile] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [stats] = useState({ gpa: 3.6, credits: 12, pending: 2 })
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    fetch('/me/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setProfile).catch(() => {})
    fetch('/me/enrollments', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setEnrollments).catch(() => {})
  }, [])

  async function onJoinClass(e) {
    e.preventDefault()
    if (!joinCode || joinCode.trim().length !== 6) { alert('Mã lớp gồm 6 chữ số'); return }
    setJoining(true)
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch('/student/join', { method:'POST', headers: hdr, body: JSON.stringify({ code: joinCode.trim() }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Join failed')
      alert('Tham gia lớp thành công')
      fetch('/me/enrollments', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setEnrollments).catch(() => {})
      setJoinCode('')
    } catch (err) {
      alert(err.message || 'Join class failed')
    } finally {
      setJoining(false)
    }
  }
  return (
    <div className="student-page">
      <TopBar />

      <section className="student-hero">
        <div className="avatar" />
        <div className="hero-info">
          <h1>Xin chào, {profile?.full_name || profile?.username || 'Học viên'}</h1>
          <div className="hero-meta">
            <span className="role-badge">Student</span>
            <span className="email">{profile?.email || '—'}</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <div className="label">GPA</div>
            <div className="value">{stats.gpa}</div>
          </div>
          <div className="stat-card">
            <div className="label">Tín chỉ</div>
            <div className="value">{stats.credits}</div>
          </div>
          <div className="stat-card">
            <div className="label">Đang chờ</div>
            <div className="value">{stats.pending}</div>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-grid">
          <div>
            <div className="label">Họ và tên</div>
            <div className="value">{profile?.full_name || '—'}</div>
          </div>
          <div>
            <div className="label">Email</div>
            <div className="value">{profile?.email || '—'}</div>
          </div>
          <div>
            <div className="label">Username</div>
            <div className="value">{profile?.username || '—'}</div>
          </div>
        </div>
      </section>

      <section className="student-courses">
        <div className="section-head">
          <h2>Khoá học của tôi</h2>
        </div>
        <div className="panel" style={{ marginBottom: 12 }}>
          <h3 className="panel-title">Tham gia lớp bằng mã</h3>
          <form className="stack-form" onSubmit={onJoinClass} aria-label="Join class">
            <div className="field">
              <input type="text" placeholder="Nhập mã lớp (6 số)" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            </div>
            <button className="btn" disabled={joining} type="submit">{joining? 'Đang tham gia...' : 'Tham gia lớp'}</button>
          </form>
        </div>
        <div className="courses-grid">
          {(Array.isArray(enrollments)?enrollments:[]).map(e => (
            <div key={(e._id||e.course_id?._id||e.course_id)} className="course-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <h3 style={{ margin: 0 }}>{e.course_id?.title || 'Khoá học'}</h3>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `0%` }} />
              </div>
              <div className="progress-label">Đã tham gia: {new Date(e.enrolled_at).toLocaleDateString()}</div>
            </div>
          ))}
          {Array.isArray(enrollments) && enrollments.length === 0 && (
            <div className="empty-state">Chưa có khoá học nào. Vui lòng liên hệ quản trị.</div>
          )}
        </div>
      </section>

      {/* Removed activity section as requested */}
    </div>
  )
}

function AdminPage() {
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([])
  const [classes, setClasses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [activity, setActivity] = useState([])
  const [activitySearch, setActivitySearch] = useState('')
  const [activityFilter, setActivityFilter] = useState({ userId: '', status: '', limit: '50' })
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '' })
  const [errors, setErrors] = useState({})
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', lecturer_id: '' })
  const [courseErrors, setCourseErrors] = useState({})
  const [creatingClass, setCreatingClass] = useState(false)
  const [classForm, setClassForm] = useState({ name: '', course_id: '', teacher_id: '' })
  const [classErrors, setClassErrors] = useState({})
  const [updating, setUpdating] = useState(false)
  const [tab, setTab] = useState('users')
  const [userView, setUserView] = useState('teachers') // teachers | students
  const [query, setQuery] = useState('')
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    const hdr = { Authorization: `Bearer ${token}` }
    fetch('/admin/users/students', { headers: hdr }).then(r=>r.json()).then(setStudents).catch(()=>{})
    fetch('/admin/users/teachers', { headers: hdr }).then(r=>r.json()).then(setTeachers).catch(()=>{})
    fetch('/admin/courses', { headers: hdr }).then(r=>r.json()).then(setCourses).catch(()=>{})
    fetch('/admin/classes', { headers: hdr }).then(r=>r.json()).then(setClasses).catch(()=>{})
    fetch('/admin/enrollments?limit=20', { headers: hdr }).then(r=>r.json()).then(setEnrollments).catch(()=>{})
    fetch('/admin/activity?limit=50', { headers: hdr }).then(r=>r.json()).then(setActivity).catch(()=>{})
  }, [])

  function fetchAdminActivity(params) {
    const { token } = getAuth()
    const hdr = { Authorization: `Bearer ${token}` }
    const q = new URLSearchParams()
    const limitVal = (params?.limit || activityFilter.limit || '50')
    if (limitVal) q.set('limit', String(limitVal))
    const userIdVal = (params?.userId ?? activityFilter.userId).trim()
    if (userIdVal) q.set('userId', userIdVal)
    const statusVal = (params?.status ?? activityFilter.status).trim()
    if (statusVal) q.set('status', statusVal)
    return fetch('/admin/activity?' + q.toString(), { headers: hdr })
      .then(r=>r.json()).then(setActivity).catch(()=>{})
  }

  function onApplyActivityFilter(e) {
    if (e && e.preventDefault) e.preventDefault()
    fetchAdminActivity(activityFilter)
  }

  function exportActivityCsv() {
    const cols = ['timestamp','user_id','action','target','status','ip_address','device_info']
    const list = Array.isArray(activity) ? activity : []
    function esc(v) { const s = v==null? '' : String(v).replace(/"/g,'""'); return '"' + s + '"' }
    const lines = [cols.join(',')].concat(list.map(it => [esc(it.timestamp),esc(it.user_id),esc(it.action),esc(it.target),esc(it.status),esc(it.ip_address),esc(it.device_info)].join(',')))
    const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'activity_logs.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const activityDisplay = React.useMemo(() => {
    const q = (activitySearch || '').trim().toLowerCase()
    if (!q) return activity
    const arr = Array.isArray(activity) ? activity : []
    return arr.filter(it => {
      const u = typeof it.user_id === 'object' ? (it.user_id.full_name || it.user_id.username || it.user_id.email || '') : String(it.user_id||'')
      const fields = [String(it.action||''), String(it.target_name||''), String(it.resource||''), String(it.status||''), String(it.ip_address||''), String(it.device_info||''), u]
      return fields.some(v => v.toLowerCase().includes(q))
    })
  }, [activity, activitySearch])

  function validateTeacherForm(f) {
    const e = {}
    if (!f.username || f.username.trim().length < 3) e.username = 'Tên đăng nhập tối thiểu 3 ký tự'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!f.email || !emailRe.test(f.email)) e.email = 'Email không hợp lệ'
    if (!f.full_name || f.full_name.trim().length < 2) e.full_name = 'Họ tên không được để trống'
    if (!f.password || f.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự'
    return e
  }

  async function onCreateTeacher(e) {
    e.preventDefault()
    const vErrors = validateTeacherForm(form)
    if (Object.keys(vErrors).length) {
      setErrors(vErrors)
      return
    }
    setCreating(true)
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch('/admin/users/teacher', { method:'POST', headers: hdr, body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Create failed')
      alert('Đã tạo giáo viên: ' + json.username)
      // refresh teachers
      fetch('/admin/users/teachers', { headers: { Authorization: `Bearer ${token}` } })
        .then(r=>r.json()).then(setTeachers).catch(()=>{})
      setForm({ username:'', email:'', full_name:'', password:'' })
      setErrors({})
    } catch (err) {
      alert(err.message || 'Create teacher failed')
    } finally {
      setCreating(false)
    }
  }

  async function onUpdateUserStatus(userId, nextStatus) {
    if (!userId || !nextStatus) return
    setUpdating(true)
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch(`/admin/users/${encodeURIComponent(userId)}/status`, { method:'PATCH', headers: hdr, body: JSON.stringify({ status: nextStatus }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Update failed')
      setTeachers(prev => Array.isArray(prev) ? prev.map(u => (u._id === userId ? { ...u, status: nextStatus } : u)) : prev)
      setStudents(prev => Array.isArray(prev) ? prev.map(u => (u._id === userId ? { ...u, status: nextStatus } : u)) : prev)
    } catch (err) {
      alert(err.message || 'Update status failed')
    } finally {
      setUpdating(false)
    }
  }
  async function onAdminRegenerateClassCode(classId) {
    if (!classId) return
    try {
      const { token } = getAuth()
      const hdr = { Authorization: `Bearer ${token}` }
      const res = await fetch(`/admin/classes/${encodeURIComponent(classId)}/regenerate-code`, { method:'PATCH', headers: hdr })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Regenerate failed')
      setClasses(prev => Array.isArray(prev) ? prev.map(c => (c._id === classId ? { ...c, join_code: json.join_code } : c)) : prev)
    } catch (err) {
      alert(err.message || 'Regenerate code failed')
    }
  }
  async function onAdminCopyJoinCode(code) {
    try {
      if (!code) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
        alert('Đã copy mã lớp')
      } else {
        const ta = document.createElement('textarea')
        ta.value = code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        alert('Đã copy mã lớp')
      }
    } catch {
      alert('Copy thất bại')
    }
  }

  async function onAdminCopyCourseCode(code) {
    try {
      if (!code) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
        alert('Đã copy mã khoá')
      } else {
        const ta = document.createElement('textarea')
        ta.value = code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        alert('Đã copy mã khoá')
      }
    } catch {
      alert('Copy thất bại')
    }
  }

  function validateCourseForm(f) {
    const e = {}
    if (!f.title || f.title.trim().length < 3) e.title = 'Tên khoá học tối thiểu 3 ký tự'
    if (f.lecturer_id && !/^[0-9a-fA-F]{24}$/.test(f.lecturer_id)) e.lecturer_id = 'Giảng viên không hợp lệ'
    return e
  }

  async function onCreateCourse(e) {
    e.preventDefault()
    const vErrors = validateCourseForm(courseForm)
    if (Object.keys(vErrors).length) { setCourseErrors(vErrors); return }
    setCreatingCourse(true)
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const payload = {
        title: courseForm.title,
        description: courseForm.description || undefined,
        lecturer_id: courseForm.lecturer_id || undefined,
      }
      const res = await fetch('/admin/courses', { method:'POST', headers: hdr, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Create failed')
      fetch('/admin/courses', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setCourses).catch(()=>{})
      alert('Đã tạo khoá học. Mã: ' + (json.code||'—'))
      setCourseForm({ title:'', description:'', lecturer_id:'' })
      setCourseErrors({})
    } catch (err) {
      alert(err.message || 'Create course failed')
    } finally { setCreatingCourse(false) }
  }

  function validateClassForm(f) {
    const e = {}
    if (!f.name || f.name.trim().length < 1) e.name = 'Tên lớp không được để trống'
    if (!f.course_id || !/^[0-9a-fA-F]{24}$/.test(f.course_id)) e.course_id = 'Khoá học không hợp lệ'
    if (f.teacher_id && !/^[0-9a-fA-F]{24}$/.test(f.teacher_id)) e.teacher_id = 'Giáo viên không hợp lệ'
    return e
  }

  async function onCreateClass(e) {
    e.preventDefault()
    const vErrors = validateClassForm(classForm)
    if (Object.keys(vErrors).length) { setClassErrors(vErrors); return }
    setCreatingClass(true)
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const payload = {
        name: classForm.name,
        course_id: classForm.course_id,
        teacher_id: classForm.teacher_id || undefined,
      }
      const res = await fetch('/admin/classes', { method:'POST', headers: hdr, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Create failed')
      fetch('/admin/classes', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setClasses).catch(()=>{})
      alert('Đã tạo lớp')
      setClassForm({ name:'', course_id:'', teacher_id:'' })
      setClassErrors({})
    } catch (err) {
      alert(err.message || 'Create class failed')
    } finally { setCreatingClass(false) }
  }

  const usersFiltered = (userView === 'teachers' ? (Array.isArray(teachers)?teachers:[]) : (Array.isArray(students)?students:[]))
    .filter(u => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return [u.username, u.email, u.full_name].filter(Boolean).some(x => String(x).toLowerCase().includes(q))
    })

  const stats = {
    students: Array.isArray(students) ? students.length : 0,
    teachers: Array.isArray(teachers) ? teachers.length : 0,
    courses: Array.isArray(courses) ? courses.length : 0,
    enrollments: Array.isArray(enrollments) ? enrollments.length : 0,
  }


  function displayTeacherName(val) {
    if (!val) return '—'
    if (typeof val === 'object') return val.full_name || val.username || '—'
    const t = (Array.isArray(teachers)?teachers:[]).find(x => String(x._id) === String(val))
      || (Array.isArray(students)?students:[]).find(x => String(x._id) === String(val))
    return t ? (t.full_name || t.username || t.email || String(val)) : String(val)
  }

  function displayUserName(val) {
    if (!val) return '—'
    if (typeof val === 'object') return val.full_name || val.username || val.email || '—'
    const u = (Array.isArray(students)?students:[]).find(x => String(x._id) === String(val))
      || (Array.isArray(teachers)?teachers:[]).find(x => String(x._id) === String(val))
    return u ? (u.full_name || u.username || u.email || String(val)) : String(val)
  }

  return (
    <div className="admin-page">
      <TopBar />

      <section className="admin-hero">
        <div>
          <h1>Admin Control Center</h1>
          <div className="sub">Quyền cao nhất — giám sát hệ thống</div>
        </div>
        <div className="hero-stats">
          <div className="stat-card"><div className="label">Students</div><div className="value">{stats.students}</div></div>
          <div className="stat-card"><div className="label">Teachers</div><div className="value">{stats.teachers}</div></div>
          <div className="stat-card"><div className="label">Courses</div><div className="value">{stats.courses}</div></div>
          <div className="stat-card"><div className="label">Enrollments</div><div className="value">{stats.enrollments}</div></div>
        </div>
      </section>

      <section className="admin-section">
        <div className="section-head"><h2>Quản trị</h2></div>
        <div className="tabs">
          <div className={"tab " + (tab==='users'?'active':'')} onClick={()=>setTab('users')}>Tài khoản</div>
          <div className={"tab " + (tab==='courses'?'active':'')} onClick={()=>setTab('courses')}>Khoá học</div>
          <div className={"tab " + (tab==='enrollments'?'active':'')} onClick={()=>setTab('enrollments')}>Ghi danh</div>
          <div className={"tab " + (tab==='activity'?'active':'')} onClick={()=>setTab('activity')}>Hoạt động</div>
        </div>

        {tab === 'users' && (
          <div>
            <div className="subtabs">
              <div className={"subtab " + (userView==='teachers'?'active':'')} onClick={()=>setUserView('teachers')}>Giáo viên</div>
              <div className={"subtab " + (userView==='students'?'active':'')} onClick={()=>setUserView('students')}>Học viên</div>
            </div>

            {userView==='teachers' && (
              <div className="panel">
                <h3 className="panel-title">Tạo giáo viên</h3>
                <form className="stack-form" onSubmit={onCreateTeacher} aria-label="Tạo giáo viên">
                  <div className="field">
                    <input type="text" aria-label="Tên đăng nhập" placeholder="Tên đăng nhập" value={form.username} aria-invalid={!!errors.username} onChange={e=>{ setForm({ ...form, username: e.target.value }); if (errors.username) setErrors({ ...errors, username: undefined }) }} />
                    {errors.username && <div className="form-error">{errors.username}</div>}
                  </div>
                  <div className="field">
                    <input type="email" aria-label="Email" placeholder="Email" value={form.email} aria-invalid={!!errors.email} onChange={e=>{ setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }) }} />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                  <div className="field">
                    <input type="text" aria-label="Họ tên" placeholder="Họ tên" value={form.full_name} aria-invalid={!!errors.full_name} onChange={e=>{ setForm({ ...form, full_name: e.target.value }); if (errors.full_name) setErrors({ ...errors, full_name: undefined }) }} />
                    {errors.full_name && <div className="form-error">{errors.full_name}</div>}
                  </div>
                  <div className="field">
                    <input type="password" aria-label="Mật khẩu" placeholder="Mật khẩu" value={form.password} aria-invalid={!!errors.password} onChange={e=>{ setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: undefined }) }} />
                    {errors.password && <div className="form-error">{errors.password}</div>}
                  </div>
                  <button className="btn" disabled={creating} type="submit">{creating? 'Đang tạo...' : 'Tạo giáo viên'}</button>
                </form>
              </div>
            )}

            <div className="panel">
              <div className="list-head">
                <div className="list-count">Tổng: {usersFiltered.length}</div>
                <div className="filter-bar">
                  <input type="text" placeholder="Tìm theo tên, email..." value={query} onChange={e=>setQuery(e.target.value)} />
                </div>
              </div>

              <div className="data-table">
                <div className="row head">
                  <div>Username</div><div>Email</div><div>Trạng thái</div><div>Ngày tạo</div><div>Hành động</div>
                </div>
                {usersFiltered.length === 0 ? (
                  <div className="empty-state">Không có người dùng phù hợp</div>
                ) : (
                  usersFiltered.map((u,i)=> (
                    <div key={u._id||i} className="row">
                      <div>{u.username}</div>
                      <div>{u.email||'—'}</div>
                      <div><span className={`status-badge ${u.status}`}>{u.status}</span></div>
                      <div>{new Date(u.created_at).toLocaleString()}</div>
                      <div>
                        <select defaultValue={u.status} onChange={(e)=>onUpdateUserStatus(u._id, e.target.value)} disabled={updating}>
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="blocked">blocked</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'courses' && (
          <div>
            <div className="panel">
              <h3 className="panel-title">Tạo khoá học</h3>
              <form className="inline-form" onSubmit={onCreateCourse} aria-label="Tạo khoá học">
                <div className="field">
                  <input type="text" placeholder="Tên khoá học" value={courseForm.title} aria-invalid={!!courseErrors.title} onChange={e=>{ setCourseForm({ ...courseForm, title: e.target.value }); if (courseErrors.title) setCourseErrors({ ...courseErrors, title: undefined }) }} />
                  {courseErrors.title && <div className="form-error">{courseErrors.title}</div>}
                </div>
                <div className="field">
                  <input type="text" placeholder="Mô tả" value={courseForm.description} onChange={e=> setCourseForm({ ...courseForm, description: e.target.value })} />
                </div>
                <div className="field">
                  <select value={courseForm.lecturer_id} onChange={e=>{ setCourseForm({ ...courseForm, lecturer_id: e.target.value }); if (courseErrors.lecturer_id) setCourseErrors({ ...courseErrors, lecturer_id: undefined }) }}>
                    <option value="">Giảng viên (tuỳ chọn)</option>
                    {(Array.isArray(teachers)?teachers:[]).map(t => (
                      <option key={t._id} value={t._id}>{t.full_name || t.username}</option>
                    ))}
                  </select>
                  {courseErrors.lecturer_id && <div className="form-error">{courseErrors.lecturer_id}</div>}
                </div>
                <button className="btn" disabled={creatingCourse} type="submit">{creatingCourse? 'Đang tạo...' : 'Tạo khoá học'}</button>
              </form>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3 className="panel-title">Danh sách khoá học</h3>
              <div className="data-table cols-6">
                <div className="row head">
                  <div>Tên</div><div>Mã khoá</div><div>Giảng viên</div><div>Trạng thái</div><div>Ngày tạo</div><div>—</div>
                </div>
                {(Array.isArray(courses)?courses:[]).map((c,i)=> (
                  <div key={i} className="row">
                    <div>{c.title}</div>
                    <div>
                      <div className="code-badge">{c.code||'—'}</div>
                      {c.code && (
                        <div className="code-actions">
                          <button className="btn btn-sm" type="button" onClick={()=>onAdminCopyCourseCode(c.code)}>Copy</button>
                        </div>
                      )}
                    </div>
                    <div>{displayTeacherName(c.lecturer_id)}</div>
                    <div><span className={`status-badge ${c.status}`}>{c.status}</span></div>
                    <div>{new Date(c.created_at).toLocaleString()}</div>
                    <div>—</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ marginTop: 24 }}>
              <h3 className="panel-title">Tạo lớp</h3>
              <form className="inline-form" onSubmit={onCreateClass} aria-label="Tạo lớp">
                <div className="field">
                  <label>Tên lớp</label>
                  <input type="text" placeholder="Nhập tên lớp" value={classForm.name} required aria-invalid={!!classErrors.name} onChange={e=>{ setClassForm({ ...classForm, name: e.target.value }); if (classErrors.name) setClassErrors({ ...classErrors, name: undefined }) }} />
                  {classErrors.name && <div className="form-error">{classErrors.name}</div>}
                </div>
                <div className="field">
                  <select value={classForm.course_id} onChange={e=>{ setClassForm({ ...classForm, course_id: e.target.value }); if (classErrors.course_id) setClassErrors({ ...classErrors, course_id: undefined }) }}>
                    <option value="">Chọn khoá học</option>
                    {(Array.isArray(courses)?courses:[]).map(c => (
                      <option key={c._id||c.id} value={c._id||c.id}>{c.title}</option>
                    ))}
                  </select>
                  {classErrors.course_id && <div className="form-error">{classErrors.course_id}</div>}
                </div>
                <div className="field">
                  <select value={classForm.teacher_id} onChange={e=>{ setClassForm({ ...classForm, teacher_id: e.target.value }); if (classErrors.teacher_id) setClassErrors({ ...classErrors, teacher_id: undefined }) }}>
                    <option value="">Giáo viên (tuỳ chọn)</option>
                    {(Array.isArray(teachers)?teachers:[]).map(t => (
                      <option key={t._id} value={t._id}>{t.full_name || t.username}</option>
                    ))}
                  </select>
                  {classErrors.teacher_id && <div className="form-error">{classErrors.teacher_id}</div>}
                </div>
                <button className="btn" disabled={creatingClass} type="submit">{creatingClass? 'Đang tạo...' : 'Tạo lớp'}</button>
              </form>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3 className="panel-title">Danh sách lớp</h3>
              <div className="data-table cols-6">
                <div className="row head">
                  <div>Tên lớp</div><div>Khoá học</div><div>Mã lớp</div><div>Giáo viên</div><div>Trạng thái</div><div>Ngày tạo</div>
                </div>
                {(Array.isArray(classes)?classes:[]).map((cl,i)=> (
                  <div key={i} className="row">
                    <div>{cl.name}</div>
                    <div>{typeof cl.course_id === 'object' ? (cl.course_id.title || '—') : String(cl.course_id)}</div>
                    <div>
                      <div>{cl.join_code||'—'}</div>
                      <div style={{ display:'flex', gap:8, marginTop:6 }}>
                        <button className="btn btn-sm" type="button" onClick={()=>onAdminCopyJoinCode(cl.join_code)}>Copy</button>
                        <button className="btn btn-sm" type="button" onClick={()=>onAdminRegenerateClassCode(cl._id)}>Đổi mã</button>
                      </div>
                    </div>
                    <div>{displayTeacherName(cl.teacher_id)}</div>
                    <div><span className={`status-badge ${cl.status}`}>{cl.status}</span></div>
                    <div>{new Date(cl.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'enrollments' && (
          <div className="data-table">
            <div className="row head">
              <div>Student</div><div>Course</div><div>Trạng thái</div><div>Thời gian</div><div>—</div>
            </div>
            {(Array.isArray(enrollments)?enrollments:[]).map((e,i)=> (
              <div key={i} className="row">
                <div>{displayUserName(e.student_id)}</div>
                <div>{typeof e.course_id === 'object' ? (e.course_id.title || '—') : String(e.course_id)}</div>
                <div><span className={`status-badge ${e.status}`}>{e.status}</span></div>
                <div>{new Date(e.enrolled_at||e.created_at).toLocaleString()}</div>
                <div>—</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <div className="activity-section">
            <div className="panel">
              <h3 className="panel-title">Hoạt động hệ thống</h3>
              <form className="inline-form" onSubmit={onApplyActivityFilter} aria-label="Lọc hoạt động">
                <div className="field">
                  <input type="text" placeholder="User ID" value={activityFilter.userId} onChange={e=>setActivityFilter({ ...activityFilter, userId: e.target.value })} />
                </div>
                <div className="field">
                  <select value={activityFilter.status} onChange={e=>setActivityFilter({ ...activityFilter, status: e.target.value })}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="200">200</option>
                    <option value="401">401</option>
                    <option value="403">403</option>
                    <option value="404">404</option>
                    <option value="500">500</option>
                  </select>
                </div>
                <div className="field">
                  <select value={activityFilter.limit} onChange={e=>setActivityFilter({ ...activityFilter, limit: e.target.value })}>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
                <button className="btn" type="submit">Lọc</button>
                <button className="btn btn-sm" type="button" onClick={exportActivityCsv}>Xuất CSV</button>
                <div className="field">
                  <input type="text" placeholder="Tìm theo tên/hành động/IP/thiết bị" value={activitySearch} onChange={e=>setActivitySearch(e.target.value)} />
                </div>
              </form>
              <ActivityList items={activityDisplay} />
            </div>
          </div>
        )}

      </section>

      {/* Các section cũ đã gom vào tabs trên để giao diện gọn hơn */}
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
      } catch { void 0 }
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
          <Route path="/student" element={<Protected allow={["student"]}><StudentPage /></Protected>} />
          <Route path="/admin" element={<Protected allow={["admin"]}><AdminPage /></Protected>} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
