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
  const list = Array.isArray(items) ? items : []
  return (
    <ul className="activity-list">
      {list.map((it) => (
        <li className="activity-item" key={`${it._id || it.timestamp || Math.random()}`}>
          <span className="time">{it.timestamp}</span>
          <span className="action">{it.action}</span>
          {it.target ? <span className="target">{` ${it.target}`}</span> : null}
        </li>
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
    fetch('/me/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setProfile).catch(() => {})
  }, [])
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
        <div className="courses-grid">
          {courses.map(c => (
            <div key={c.code} className="course-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <h3 style={{ margin: 0 }}>{c.title}</h3>
                <span className="code">{c.code}</span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${Math.round(c.progress * 100)}%` }} />
              </div>
              <div className="progress-label">Tiến độ: {Math.round(c.progress * 100)}%</div>
            </div>
          ))}
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
  const [enrollments, setEnrollments] = useState([])
  const [activity, setActivity] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '' })
  const [errors, setErrors] = useState({})
  const [updating, setUpdating] = useState(false)
  const [tab, setTab] = useState('users') // users | courses | enrollments | activity
  const [userView, setUserView] = useState('teachers') // teachers | students
  const [query, setQuery] = useState('')
  useEffect(() => {
    const { token } = getAuth()
    if (!token) return
    const hdr = { Authorization: `Bearer ${token}` }
    fetch('/admin/users/students', { headers: hdr }).then(r=>r.json()).then(setStudents).catch(()=>{})
    fetch('/admin/users/teachers', { headers: hdr }).then(r=>r.json()).then(setTeachers).catch(()=>{})
    fetch('/admin/courses', { headers: hdr }).then(r=>r.json()).then(setCourses).catch(()=>{})
    fetch('/admin/enrollments?limit=20', { headers: hdr }).then(r=>r.json()).then(setEnrollments).catch(()=>{})
    fetch('/admin/activity?limit=20', { headers: hdr }).then(r=>r.json()).then(setActivity).catch(()=>{})
  }, [])

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
                <form className="inline-form" onSubmit={onCreateTeacher} aria-label="Tạo giáo viên">
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
          <div className="data-table">
            <div className="row head">
              <div>Tên</div><div>Giảng viên</div><div>Trạng thái</div><div>Ngày tạo</div><div>—</div>
            </div>
            {(Array.isArray(courses)?courses:[]).map((c,i)=> (
              <div key={i} className="row">
                <div>{c.title}</div>
                <div>{c.lecturer_id||'—'}</div>
                <div><span className={`status-badge ${c.status}`}>{c.status}</span></div>
                <div>{new Date(c.created_at).toLocaleString()}</div>
                <div>—</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'enrollments' && (
          <div className="data-table">
            <div className="row head">
              <div>Student</div><div>Course</div><div>Trạng thái</div><div>Thời gian</div><div>—</div>
            </div>
            {(Array.isArray(enrollments)?enrollments:[]).map((e,i)=> (
              <div key={i} className="row">
                <div>{e.student_id}</div>
                <div>{e.course_id}</div>
                <div><span className={`status-badge ${e.status}`}>{e.status}</span></div>
                <div>{new Date(e.enrolled_at||e.created_at).toLocaleString()}</div>
                <div>—</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <div className="activity-section">
            <ActivityList items={activity} />
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
