import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function About() {
  const nav = useNavigate()
  const { t, lang, setLang } = useI18n()
  useEffect(() => {
    document.body.classList.remove('home')
  }, [])
  return (
    <div className="page" style={{ maxWidth: 980, margin: '2rem auto' }}>
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

      <section className="about-hero">
        <h1>{t('about_title')}</h1>
        <p>{t('about_mission')}</p>
        <p>{t('about_vision')}</p>
        <p>{t('about_values')}</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={()=>nav('/courses')}>{t('about_cta')}</button>
        </div>
      </section>

      <div className="feature-list">
        {[t('course_math'), t('course_eng'), t('course_lit'), t('course_phys')].map((txt, i) => (
          <div key={i} className="feature-item">
            <div className="icon" />
            <div>
              <div style={{ fontWeight: 800, color: '#0a4ea8' }}>{txt}</div>
              <div style={{ color:'#374151' }}>{lang==='vi' ? 'Nội dung bám sát, dễ hiểu, phù hợp nhiều trình độ.' : 'Aligned, easy-to-understand content for various levels.'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}