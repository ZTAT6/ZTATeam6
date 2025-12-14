import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

const sampleCourses = [
  { key: 'course_math', levelKey: 'level_beginner' },
  { key: 'course_lit', levelKey: 'level_intermediate' },
  { key: 'course_eng', levelKey: 'level_beginner' },
  { key: 'course_phys', levelKey: 'level_advanced' },
]

export default function Courses() {
  const nav = useNavigate()
  const { t, lang, setLang } = useI18n()
  const [courses, setCourses] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('custom_courses') || '[]')
      return [...sampleCourses, ...saved]
    } catch { return sampleCourses }
  })
  const [newTitle, setNewTitle] = React.useState('')
  const [newLevel, setNewLevel] = React.useState('level_beginner')
  useEffect(() => {
    document.body.classList.remove('home')
  }, [])

  function addCourse() {
    const title = (newTitle || '').trim()
    if (!title) return alert(t('add_course_invalid'))
    const custom = { title, levelKey: newLevel }
    setCourses(prev => {
      const next = [...prev, custom]
      try {
        const customOnly = next.filter(c => !c.key)
        localStorage.setItem('custom_courses', JSON.stringify(customOnly))
      } catch { void 0 }
      return next
    })
    setNewTitle('')
    alert(t('add_course_added'))
  }

  return (
    <div className="page" style={{ maxWidth: 1020, margin: '2rem auto' }}>
      <div className="page-head">
        <div className="brand">{t('brand')}</div>
        <div className="controls">
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

  <h1 style={{ marginTop: 0 }}>{t('courses_title')}</h1>
  <p style={{ color:'#555' }}>{t('courses_desc')}</p>

  {/* Add course form */}
  <div className="add-course-form" style={{ display:'grid', gridTemplateColumns:'1.2fr .8fr auto', gap: 10, alignItems:'center', marginTop: 12, background:'#fff', border:'1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
    <div>
      <label style={{ display:'block', fontSize: 12, color:'#6b7280', marginBottom: 6 }}>{t('add_course_name_label')}</label>
      <input type="text" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} placeholder={t('add_course_name_label')} style={{ width:'100%', height:38, border:'1px solid #e5e7eb', borderRadius: 10, padding:'0 10px' }} />
    </div>
    <div>
      <label style={{ display:'block', fontSize: 12, color:'#6b7280', marginBottom: 6 }}>{t('add_course_level_label')}</label>
      <select value={newLevel} onChange={(e)=>setNewLevel(e.target.value)} style={{ width:'100%', height:38, border:'1px solid #e5e7eb', borderRadius: 10, padding:'0 10px' }}>
        <option value="level_beginner">{t('level_beginner')}</option>
        <option value="level_intermediate">{t('level_intermediate')}</option>
        <option value="level_advanced">{t('level_advanced')}</option>
      </select>
    </div>
    <div style={{ alignSelf:'end' }}>
      <button onClick={addCourse}>{t('add_course_add_btn')}</button>
    </div>
  </div>

      <div className="courses-grid">
        {courses.map((c, i) => (
          <div key={i} className="course-card">
            <h3>{c.key ? t(c.key) : c.title}</h3>
            <span className="level-tag">{t(c.levelKey)}</span>
            <div className="course-actions">
              <button onClick={()=>alert((lang==='vi'?'Đã đăng ký: ':'Enrolled: ') + (c.key ? t(c.key) : c.title))}>{t('course_enroll')}</button>
              <button onClick={()=>alert((lang==='vi'?'Xem: ':'Viewing: ') + (c.key ? t(c.key) : c.title))}>{t('course_view')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}