import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import OtpInput from './components/OtpInput'
import PasswordStrength, { scorePassword } from './components/PasswordStrength'
import Home from './pages/Home'
import About from './pages/About'
import Courses from './pages/Courses'
import Fee from './pages/Fee'
import Support from './pages/Support'
import { I18nProvider, useI18n } from './i18n.jsx'
import { PERMISSION_GROUPS, PERMISSION_LABELS } from './permissions'

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
                <input name="username" type="text" placeholder={t('usernameOptional')} />
              </div>
              <div className="field">
                <input name="password" type="password" placeholder={t('password')} value={signupPassword} onChange={(e)=>setSignupPassword(e.target.value)} required />
                <PasswordStrength password={signupPassword} />
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
        // Theo dõi: hiển thị từng bản ghi ActivityLog gồm thời gian, hành động, mục tiêu, status, resource, user, IP và device
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
  const [myCourses, setMyCourses] = useState([])
  const [myClasses, setMyClasses] = useState([])
  const [profile, setProfile] = useState(null)
  const [trusted, setTrusted] = useState(true)
  const [creatingClass, setCreatingClass] = useState(false)
  const [classForm, setClassForm] = useState({ name: '', course_id: '' })
  const [classErrors, setClassErrors] = useState({})
  const [renameMap, setRenameMap] = useState({})
  const [scheduleMap, setScheduleMap] = useState({})
  const [assignMap, setAssignMap] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
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
  async function onRenameClass(classId) {
    if (!classId) return
    const nextName = (renameMap[classId] ?? '').trim()
    if (!nextName) return alert('Tên lớp không được để trống')
    try {
      setBusyId(classId)
      const { token } = getAuth()
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch(`/teacher/classes/${encodeURIComponent(classId)}`, { method:'PATCH', headers: hdr, body: JSON.stringify({ name: nextName }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Update failed')
      setMyClasses(prev => Array.isArray(prev) ? prev.map(c => (c._id === classId ? { ...c, name: nextName } : c)) : prev)
      alert('Đã đổi tên lớp')
    } catch (err) {
      alert(err.message || 'Rename failed')
    } finally { setBusyId(null) }
  }
  async function onDeleteClass(classId) {
    if (!classId) return
    try {
      setBusyId(classId)
      const { token } = getAuth()
      const hdr = { Authorization: `Bearer ${token}` }
      const res = await fetch(`/teacher/classes/${encodeURIComponent(classId)}`, { method:'DELETE', headers: hdr })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Delete failed')
      setMyClasses(prev => Array.isArray(prev) ? prev.filter(c => c._id !== classId) : prev)
      alert('Đã xóa lớp')
    } catch (err) {
      alert(err.message || 'Delete failed')
    } finally { setBusyId(null) }
  }
  async function onScheduleClass(classId) {
    try {
      setBusyId(classId)
      const { token } = getAuth()
      const payload = scheduleMap[classId] || {}
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch(`/teacher/classes/${encodeURIComponent(classId)}/schedule`, { method:'POST', headers: hdr, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Schedule failed')
      alert('Đã thiết lập lịch học')
    } catch (err) {
      const msg = String(err.message||'').includes('Missing permission')
        ? 'Thiếu quyền: Thiết lập lịch học'
        : (err.message || 'Thiết lập lịch học thất bại')
      alert(msg)
    } finally { setBusyId(null) }
  }
  async function onAssignContent(classId) {
    try {
      setBusyId(classId)
      const { token } = getAuth()
      const payload = assignMap[classId] ? { content: assignMap[classId] } : {}
      const hdr = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch(`/teacher/classes/${encodeURIComponent(classId)}/content`, { method:'POST', headers: hdr, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Assign failed')
      alert('Đã gán học liệu/bài kiểm tra cho lớp')
    } catch (err) {
      alert(err.message || 'Assign failed')
    } finally { setBusyId(null) }
  }
  async function onCopyJoinCode(code) {
    try {
      if (!code) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
        alert('Class code copied')
      } else {
        const ta = document.createElement('textarea')
        ta.value = code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
    alert('Class code copied')
      }
    } catch {
    alert('Copy failed')
    }
  }
  return (
    <div className="teacher-page">
      <TopBar />

      <section className="teacher-hero">
        <div className="avatar" />
        <div className="hero-info">
          <h1>Hello, {profile?.full_name || profile?.username || 'Teacher'}</h1>
          <div className="hero-meta">
            <span className="role-badge">Teacher</span>
            <span className="email">{profile?.email || '—'}</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card"><div className="label">Courses</div><div className="value">{Array.isArray(myCourses)?myCourses.length:0}</div></div>
          <div className="stat-card"><div className="label">Classes</div><div className="value">{Array.isArray(myClasses)?myClasses.length:0}</div></div>
          <div className="stat-card"><div className="label">Active</div><div className="value">{Array.isArray(myClasses)?myClasses.filter(c=>c.status==='active').length:0}</div></div>
        </div>
      </section>

      <section className="teacher-section">
        <div className="section-head"><h2>Class Management</h2></div>
        <div className="panel">
          <h3 className="panel-title">Create Class</h3>
          <form className="stack-form" onSubmit={onCreateClass} aria-label="Create class">
            <div className="field">
              <label>Class name</label>
              <input type="text" placeholder="Enter class name" value={classForm.name} required aria-invalid={!!classErrors.name} onChange={e=>{ setClassForm({ ...classForm, name: e.target.value }); if (classErrors.name) setClassErrors({ ...classErrors, name: undefined }) }} />
              {classErrors.name && <div className="form-error">{classErrors.name}</div>}
            </div>
            <div className="field">
              <select value={classForm.course_id} onChange={e=>{ setClassForm({ ...classForm, course_id: e.target.value }); if (classErrors.course_id) setClassErrors({ ...classErrors, course_id: undefined }) }}>
                <option value="">Select my course</option>
                {(Array.isArray(myCourses)?myCourses:[]).map(c => (
                  <option key={c._id||c.id} value={c._id||c.id}>{c.title}</option>
                ))}
              </select>
              {classErrors.course_id && <div className="form-error">{classErrors.course_id}</div>}
            </div>
            <button className="btn" disabled={creatingClass || !trusted} type="submit">{creatingClass? 'Creating...' : 'Create class'}</button>
          </form>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h3 className="panel-title">My Classes</h3>
          <div className="cards-grid">
            {(Array.isArray(myClasses)?myClasses:[]).map((cl,i)=> {
              const isSelected = selectedClassId === cl._id
              return (
              <div key={cl._id||i} className={`card${isSelected ? ' selected' : ''}`}>
                <div className="card-header" aria-expanded={isSelected}>
                  <div className="title">{cl.name}</div>
                  <span className={`status-badge ${cl.status}`}>{cl.status}</span>
                </div>
                <div className="meta">Course: {cl.course_id}</div>
                <div className="meta">Class code: {cl.join_code || '—'}</div>
                <div className="meta">Created: {new Date(cl.created_at).toLocaleString()}</div>
                <div className="card-actions">
                  <button className="btn btn-sm" type="button" onClick={()=>onCopyJoinCode(cl.join_code)}>Copy code</button>
                  <button className="btn btn-sm" disabled={!trusted} type="button" onClick={()=>onRegenerateClassCode(cl._id)}>Regenerate code</button>
                  <button
                    className="btn btn-sm"
                    type="button"
                    aria-expanded={isSelected}
                    onClick={()=>{ if (isSelected) { setSelectedClassId(null); setSelectedAction(null) } else { setSelectedClassId(cl._id); setSelectedAction('status') } }}
                  >{isSelected ? 'Đóng' : 'Quản lý lớp'}</button>
                </div>
              </div>
            )})}
          </div>
          {selectedClassId && (
            (() => {
              const selected = (Array.isArray(myClasses)?myClasses:[]).find(c => c._id === selectedClassId)
              if (!selected) return null
              const canSchedule = Array.isArray(profile?.permissions) && profile.permissions.includes('class:schedule')
              return (
              <div className="panel manager-panel">
                <div className="manager-head">
                  <h3 className="panel-title">Quản lý lớp: {selected.name}</h3>
                  <button className="btn btn-sm" type="button" onClick={()=>{ setSelectedClassId(null); setSelectedAction(null) }}>Đóng</button>
                </div>
                <div className="meta">Mã lớp: {selected.join_code || '—'} • Trạng thái: <span className={`status-badge ${selected.status}`}>{selected.status}</span></div>
                <div className="subtabs" style={{ marginTop: 10 }}>
                  <button type="button" className={`subtab${selectedAction==='status'?' active':''}`} onClick={()=>setSelectedAction('status')}>Trạng thái</button>
                  <button type="button" className={`subtab${selectedAction==='rename'?' active':''}`} onClick={()=>setSelectedAction('rename')}>Đổi tên</button>
                  {canSchedule && <button type="button" className={`subtab${selectedAction==='schedule'?' active':''}`} onClick={()=>setSelectedAction('schedule')}>Lập lịch</button>}
                  <button type="button" className={`subtab${selectedAction==='assign'?' active':''}`} onClick={()=>setSelectedAction('assign')}>Gán học liệu</button>
                  <button type="button" className={`subtab${selectedAction==='delete'?' active':''}`} onClick={()=>setSelectedAction('delete')}>Xóa lớp</button>
                </div>
                {selectedAction==='status' && (
                  <div className="class-status" style={{ marginTop: 10 }}>
                    <select defaultValue={selected.status} disabled={!trusted} onChange={(e)=>onUpdateClassStatus(selected._id, e.target.value)}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </div>
                )}
                {selectedAction==='rename' && (
                  <div className="class-ops" id={`class-ops-${selected._id}-rename`}>
                    <div className="class-row two">
                      <input type="text" placeholder="Đổi tên lớp" value={renameMap[selected._id] ?? selected.name} onChange={(e)=>setRenameMap(prev=>({ ...prev, [selected._id]: e.target.value }))} />
                      <button className="btn btn-sm" type="button" disabled={!trusted || busyId===selected._id} onClick={()=>onRenameClass(selected._id)}>Đổi tên</button>
                    </div>
                  </div>
                )}
                {selectedAction==='schedule' && canSchedule && (
                  <div className="class-ops" id={`class-ops-${selected._id}-schedule`}>
                    <div className="class-row three">
                      <input type="text" placeholder="Link buổi học" value={(scheduleMap[selected._id]?.link)||''} onChange={(e)=>setScheduleMap(prev=>({ ...prev, [selected._id]: { ...(prev[selected._id]||{}), link: e.target.value } }))} />
                      <input type="datetime-local" value={(scheduleMap[selected._id]?.time)||''} onChange={(e)=>setScheduleMap(prev=>({ ...prev, [selected._id]: { ...(prev[selected._id]||{}), time: e.target.value } }))} />
                      <button className="btn btn-sm" type="button" disabled={!trusted || busyId===selected._id} onClick={()=>onScheduleClass(selected._id)}>Thiết lập lịch học</button>
                    </div>
                  </div>
                )}
                {selectedAction==='assign' && (
                  <div className="class-ops" id={`class-ops-${selected._id}-assign`}>
                    <div className="class-row three actions">
                      <input type="text" placeholder="ID/tiêu đề học liệu" value={assignMap[selected._id]||''} onChange={(e)=>setAssignMap(prev=>({ ...prev, [selected._id]: e.target.value }))} />
                      <button className="btn btn-sm" type="button" disabled={!trusted || busyId===selected._id} onClick={()=>onAssignContent(selected._id)}>Gán học liệu</button>
                      <button className="btn btn-sm" type="button" onClick={()=>setSelectedAction('delete')}>Sang Xóa</button>
                    </div>
                  </div>
                )}
                {selectedAction==='delete' && (
                  <div className="class-ops" id={`class-ops-${selected._id}-delete`}>
                    <div className="class-row two">
                      <input type="text" value={selected.name} disabled />
                      <button className="btn btn-sm btn-danger" type="button" disabled={!trusted || busyId===selected._id} onClick={()=>onDeleteClass(selected._id)}>Xóa lớp</button>
                    </div>
                  </div>
                )}
              </div>
              )
            })()
          )}
        </div>
      </section>

      {!trusted && (
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="form-error">Untrusted device — view‑only mode. Please confirm login via email to enable editing.</div>
        </div>
      )}

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
    if (!joinCode || joinCode.trim().length !== 6) { alert('Class code must be 6 digits'); return }
    setJoining(true)
    try {
      const { token } = getAuth()
      const hdr = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      const res = await fetch('/student/join', { method:'POST', headers: hdr, body: JSON.stringify({ code: joinCode.trim() }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Join failed')
      alert('Joined class successfully')
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
          <h1>Hello, {profile?.full_name || profile?.username || 'Student'}</h1>
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
            <div className="label">Credits</div>
            <div className="value">{stats.credits}</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending</div>
            <div className="value">{stats.pending}</div>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-grid">
          <div>
            <div className="label">Full name</div>
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
          <h2>My Courses</h2>
        </div>
        <div className="panel" style={{ marginBottom: 12 }}>
          <h3 className="panel-title">Join class with code</h3>
          <form className="stack-form" onSubmit={onJoinClass} aria-label="Join class">
            <div className="field">
              <input type="text" placeholder="Enter class code (6 digits)" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            </div>
            <button className="btn" disabled={joining} type="submit">{joining? 'Joining...' : 'Join class'}</button>
          </form>
        </div>
        <div className="courses-grid">
          {(Array.isArray(enrollments)?enrollments:[]).map(e => (
            <div key={(e._id||e.course_id?._id||e.course_id)} className="course-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <h3 style={{ margin: 0 }}>{e.course_id?.title || 'Course'}</h3>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `0%` }} />
              </div>
              <div className="progress-label">Joined on: {new Date(e.enrolled_at).toLocaleDateString()}</div>
            </div>
          ))}
          {Array.isArray(enrollments) && enrollments.length === 0 && (
            <div className="empty-state">No courses yet. Please contact admin.</div>
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
  
  const [editingPermissions, setEditingPermissions] = useState(null) // user object
  const [permissionForm, setPermissionForm] = useState([]) // array of strings
  const [savingPerms, setSavingPerms] = useState(false)

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
    // Theo dõi: xuất ActivityLog hiện tại ra CSV để phân tích/tuỳ biến báo cáo
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
    if (!f.username || f.username.trim().length < 3) e.username = 'Username must be at least 3 characters'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!f.email || !emailRe.test(f.email)) e.email = 'Invalid email'
    if (!f.full_name || f.full_name.trim().length < 2) e.full_name = 'Full name is required'
    if (!f.password || f.password.length < 6) e.password = 'Password must be at least 6 characters'
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
      alert('Teacher created: ' + json.username)
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

  async function onDeleteUser(userId) {
    if (!userId) return
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này không? Hành động này không thể hoàn tác.')) return
    try {
      const { token } = getAuth()
      const hdr = { Authorization: `Bearer ${token}` }
      const res = await fetch(`/admin/users/${encodeURIComponent(userId)}`, { method:'DELETE', headers: hdr })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Delete failed')
      setTeachers(prev => Array.isArray(prev) ? prev.filter(u => u._id !== userId) : prev)
      setStudents(prev => Array.isArray(prev) ? prev.filter(u => u._id !== userId) : prev)
      alert('Đã xóa người dùng')
    } catch (err) {
      alert(err.message || 'Delete user failed')
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


  function validateCourseForm(f) {
    const e = {}
    if (!f.title || f.title.trim().length < 3) e.title = 'Course title must be at least 3 characters'
    if (f.lecturer_id && !/^[0-9a-fA-F]{24}$/.test(f.lecturer_id)) e.lecturer_id = 'Invalid lecturer'
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
      alert('Course created')
      setCourseForm({ title:'', description:'', lecturer_id:'' })
      setCourseErrors({})
    } catch (err) {
      alert(err.message || 'Create course failed')
    } finally { setCreatingCourse(false) }
  }

  function validateClassForm(f) {
    const e = {}
    if (!f.name || f.name.trim().length < 1) e.name = 'Class name is required'
    if (!f.course_id || !/^[0-9a-fA-F]{24}$/.test(f.course_id)) e.course_id = 'Invalid course'
    if (f.teacher_id && !/^[0-9a-fA-F]{24}$/.test(f.teacher_id)) e.teacher_id = 'Invalid teacher'
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
      alert('Class created')
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

  function openPermissionEditor(user) {
    setEditingPermissions(user)
    setPermissionForm(user.permissions || [])
  }

  async function savePermissions(e) {
    e.preventDefault()
    if (!editingPermissions) return
    setSavingPerms(true)
    const { token } = getAuth()
    try {
      const res = await api(`/admin/users/${editingPermissions._id}/permissions`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permissions: permissionForm })
      })
      // Update local state
      setTeachers(teachers.map(t => t._id === res.id ? { ...t, permissions: res.permissions } : t))
      setEditingPermissions(null)
      alert('Permissions updated successfully')
    } catch (err) {
      alert(err?.data?.error || 'Failed to update permissions')
    } finally {
      setSavingPerms(false)
    }
  }

  function togglePermission(perm) {
    if (permissionForm.includes(perm)) {
      setPermissionForm(permissionForm.filter(p => p !== perm))
    } else {
      setPermissionForm([...permissionForm, perm])
    }
  }

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
          <div className="sub">Highest privileges — system oversight</div>
        </div>
        <div className="hero-stats">
          <div className="stat-card"><div className="label">Students</div><div className="value">{stats.students}</div></div>
          <div className="stat-card"><div className="label">Teachers</div><div className="value">{stats.teachers}</div></div>
          <div className="stat-card"><div className="label">Courses</div><div className="value">{stats.courses}</div></div>
          <div className="stat-card"><div className="label">Enrollments</div><div className="value">{stats.enrollments}</div></div>
        </div>
      </section>

      <section className="admin-section">
        <div className="section-head"><h2>Administration</h2></div>
        <div className="tabs">
          <div className={"tab " + (tab==='users'?'active':'')} onClick={()=>setTab('users')}>Accounts</div>
          <div className={"tab " + (tab==='courses'?'active':'')} onClick={()=>setTab('courses')}>Courses</div>
          <div className={"tab " + (tab==='enrollments'?'active':'')} onClick={()=>setTab('enrollments')}>Enrollments</div>
          <div className={"tab " + (tab==='activity'?'active':'')} onClick={()=>setTab('activity')}>Activity</div>
        </div>

        {tab === 'users' && (
          <div>
            <div className="subtabs">
              <div className={"subtab " + (userView==='teachers'?'active':'')} onClick={()=>setUserView('teachers')}>Teachers</div>
              <div className={"subtab " + (userView==='students'?'active':'')} onClick={()=>setUserView('students')}>Students</div>
            </div>

            {userView==='teachers' && (
              <div className="panel">
                <h3 className="panel-title">Create Teacher</h3>
                <form className="stack-form" onSubmit={onCreateTeacher} aria-label="Create teacher">
                  <div className="field">
                    <input type="text" aria-label="Username" placeholder="Username" value={form.username} aria-invalid={!!errors.username} onChange={e=>{ setForm({ ...form, username: e.target.value }); if (errors.username) setErrors({ ...errors, username: undefined }) }} />
                    {errors.username && <div className="form-error">{errors.username}</div>}
                  </div>
                  <div className="field">
                    <input type="email" aria-label="Email" placeholder="Email" value={form.email} aria-invalid={!!errors.email} onChange={e=>{ setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }) }} />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                  <div className="field">
                    <input type="text" aria-label="Full name" placeholder="Full name" value={form.full_name} aria-invalid={!!errors.full_name} onChange={e=>{ setForm({ ...form, full_name: e.target.value }); if (errors.full_name) setErrors({ ...errors, full_name: undefined }) }} />
                    {errors.full_name && <div className="form-error">{errors.full_name}</div>}
                  </div>
                  <div className="field">
                    <input type="password" aria-label="Password" placeholder="Password" value={form.password} aria-invalid={!!errors.password} onChange={e=>{ setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: undefined }) }} />
                    {errors.password && <div className="form-error">{errors.password}</div>}
                  </div>
                  <button className="btn" disabled={creating} type="submit">{creating? 'Creating...' : 'Create teacher'}</button>
                </form>
              </div>
            )}

            <div className="panel">
              <div className="list-head">
                <div className="list-count">Total: {usersFiltered.length}</div>
                <div className="filter-bar">
                  <input type="text" placeholder="Search by name, email..." value={query} onChange={e=>setQuery(e.target.value)} />
                </div>
              </div>

              <div className="data-table">
                <div className="row head">
                  <div>Username</div><div>Email</div><div>Status</div><div>Created At</div><div>Actions</div>
                </div>
                {usersFiltered.length === 0 ? (
                  <div className="empty-state">No matching users</div>
                ) : (
                  usersFiltered.map((u,i)=> (
                    <div key={u._id||i} className="row">
                      <div>{u.username}</div>
                      <div>{u.email||'—'}</div>
                      <div><span className={`status-badge ${u.status}`}>{u.status}</span></div>
                      <div>{new Date(u.created_at).toLocaleString()}</div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {userView === 'teachers' && <button className="btn btn-sm" onClick={()=>openPermissionEditor(u)}>Permissions</button>}
                        <select defaultValue={u.status} onChange={(e)=>onUpdateUserStatus(u._id, e.target.value)} disabled={updating}>
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="blocked">blocked</option>
                        </select>
                        <button className="btn btn-sm" onClick={()=>onDeleteUser(u._id)} style={{ backgroundColor:'#ef4444', color:'#fff', border:'none' }}>Xóa</button>
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
              <h3 className="panel-title">Create Course</h3>
              <form className="inline-form" onSubmit={onCreateCourse} aria-label="Create course">
                <div className="field">
                  <input type="text" placeholder="Course title" value={courseForm.title} aria-invalid={!!courseErrors.title} onChange={e=>{ setCourseForm({ ...courseForm, title: e.target.value }); if (courseErrors.title) setCourseErrors({ ...courseErrors, title: undefined }) }} />
                  {courseErrors.title && <div className="form-error">{courseErrors.title}</div>}
                </div>
                <div className="field">
                  <input type="text" placeholder="Description" value={courseForm.description} onChange={e=> setCourseForm({ ...courseForm, description: e.target.value })} />
                </div>
                <div className="field">
                  <select value={courseForm.lecturer_id} onChange={e=>{ setCourseForm({ ...courseForm, lecturer_id: e.target.value }); if (courseErrors.lecturer_id) setCourseErrors({ ...courseErrors, lecturer_id: undefined }) }}>
                    <option value="">Lecturer (optional)</option>
                    {(Array.isArray(teachers)?teachers:[]).map(t => (
                      <option key={t._id} value={t._id}>{t.full_name || t.username}</option>
                    ))}
                  </select>
                  {courseErrors.lecturer_id && <div className="form-error">{courseErrors.lecturer_id}</div>}
                </div>
                <button className="btn" disabled={creatingCourse} type="submit">{creatingCourse? 'Creating...' : 'Create course'}</button>
              </form>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3 className="panel-title">Course List</h3>
              <div className="data-table">
                <div className="row head">
                  <div>Title</div><div>Lecturer</div><div>Status</div><div>Created At</div><div>—</div>
                </div>
                {(Array.isArray(courses)?courses:[]).map((c,i)=> (
                  <div key={i} className="row">
                    <div>{c.title}</div>
                    <div>{displayTeacherName(c.lecturer_id)}</div>
                    <div><span className={`status-badge ${c.status}`}>{c.status}</span></div>
                    <div>{new Date(c.created_at).toLocaleString()}</div>
                    <div>—</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ marginTop: 24 }}>
              <h3 className="panel-title">Create Class</h3>
              <form className="inline-form" onSubmit={onCreateClass} aria-label="Tạo lớp">
                <div className="field">
                  <label>Class name</label>
                  <input type="text" placeholder="Enter class name" value={classForm.name} required aria-invalid={!!classErrors.name} onChange={e=>{ setClassForm({ ...classForm, name: e.target.value }); if (classErrors.name) setClassErrors({ ...classErrors, name: undefined }) }} />
                  {classErrors.name && <div className="form-error">{classErrors.name}</div>}
                </div>
                <div className="field">
                  <select value={classForm.course_id} onChange={e=>{ setClassForm({ ...classForm, course_id: e.target.value }); if (classErrors.course_id) setClassErrors({ ...classErrors, course_id: undefined }) }}>
                    <option value="">Select course</option>
                    {(Array.isArray(courses)?courses:[]).map(c => (
                      <option key={c._id||c.id} value={c._id||c.id}>{c.title}</option>
                    ))}
                  </select>
                  {classErrors.course_id && <div className="form-error">{classErrors.course_id}</div>}
                </div>
                <div className="field">
                  <select value={classForm.teacher_id} onChange={e=>{ setClassForm({ ...classForm, teacher_id: e.target.value }); if (classErrors.teacher_id) setClassErrors({ ...classErrors, teacher_id: undefined }) }}>
                    <option value="">Teacher (optional)</option>
                    {(Array.isArray(teachers)?teachers:[]).map(t => (
                      <option key={t._id} value={t._id}>{t.full_name || t.username}</option>
                    ))}
                  </select>
                  {classErrors.teacher_id && <div className="form-error">{classErrors.teacher_id}</div>}
                </div>
                <button className="btn" disabled={creatingClass} type="submit">{creatingClass? 'Creating...' : 'Create class'}</button>
              </form>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3 className="panel-title">Class List</h3>
              <div className="data-table cols-6">
                <div className="row head">
                  <div>Class Name</div><div>Course</div><div>Class Code</div><div>Teacher</div><div>Status</div><div>Created At</div>
                </div>
                {(Array.isArray(classes)?classes:[]).map((cl,i)=> (
                  <div key={i} className="row">
                    <div>{cl.name}</div>
                    <div>{typeof cl.course_id === 'object' ? (cl.course_id.title || '—') : String(cl.course_id)}</div>
                    <div>
                      <div>{cl.join_code||'—'}</div>
                      <div style={{ display:'flex', gap:8, marginTop:6 }}>
                        <button className="btn btn-sm" type="button" onClick={()=>onAdminCopyJoinCode(cl.join_code)}>Copy</button>
                        <button className="btn btn-sm" type="button" onClick={()=>onAdminRegenerateClassCode(cl._id)}>Regenerate code</button>
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
              <div>Student</div><div>Course</div><div>Status</div><div>Time</div><div>—</div>
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
              <h3 className="panel-title">System Activity</h3>
              <form className="inline-form" onSubmit={onApplyActivityFilter} aria-label="Filter activity">
                <div className="field">
                  <input type="text" placeholder="User ID" value={activityFilter.userId} onChange={e=>setActivityFilter({ ...activityFilter, userId: e.target.value })} />
                </div>
                <div className="field">
                  <select value={activityFilter.status} onChange={e=>setActivityFilter({ ...activityFilter, status: e.target.value })}>
                    <option value="">All statuses</option>
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
                <button className="btn" type="submit">Filter</button>
                <button className="btn btn-sm" type="button" onClick={exportActivityCsv}>Export CSV</button>
                <div className="field">
                  <input type="text" placeholder="Search by name/action/IP/device" value={activitySearch} onChange={e=>setActivitySearch(e.target.value)} />
                </div>
              </form>
              <ActivityList items={activityDisplay} />
            </div>
          </div>
        )}

        {editingPermissions && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <div style={{ background:'#fff', padding:24, borderRadius:12, width:600, maxWidth:'90vw', maxHeight:'90vh', overflowY:'auto' }}>
              <h3 style={{ marginTop:0 }}>Manage Permissions: {editingPermissions.username}</h3>
              <form onSubmit={savePermissions}>
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group} style={{ marginBottom: 16 }}>
                    <h4 style={{ margin:'0 0 8px', color:'#0a4ea8' }}>{group}</h4>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {perms.map(p => (
                        <label key={p} style={{ display:'flex', gap:8, alignItems:'center', fontSize:14, cursor:'pointer' }}>
                          <input type="checkbox" checked={permissionForm.includes(p)} onChange={()=>togglePermission(p)} />
                          {PERMISSION_LABELS[p] || p}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', gap:12, marginTop:24, justifyContent:'flex-end' }}>
                  <button type="button" className="btn" style={{ background:'#eee', color:'#333' }} onClick={()=>setEditingPermissions(null)}>Cancel</button>
                  <button type="submit" className="btn" disabled={savingPerms}>{savingPerms?'Saving...':'Save Changes'}</button>
                </div>
              </form>
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
          <Route path="/fee" element={<Fee />} />
          <Route path="/support" element={<Support />} />
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
