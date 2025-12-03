import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function Support() {
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
        <h1>{t('menu_support')}</h1>
        <p>Contact us for help with your account, courses, or payments.</p>
        <div style={{ marginTop: 12 }}>
          <form style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, maxWidth: 900, width:'100%', margin:'0 auto' }} onSubmit={(e)=>{e.preventDefault(); alert('Submitted!')}}>
            <input type="email" placeholder={lang==='vi'?'Email':'Email'} required style={{ height:48, padding:'0 16px', fontSize:16, borderRadius:10, border:'1px solid #e5e7eb' }} />
            <input type="text" placeholder={lang==='vi'?'Tiêu đề':'Subject'} required style={{ height:48, padding:'0 16px', fontSize:16, borderRadius:10, border:'1px solid #e5e7eb' }} />
            <textarea placeholder={lang==='vi'?'Nội dung hỗ trợ':'Describe your issue'} rows={6} required style={{ padding:'12px 16px', fontSize:16, borderRadius:10, border:'1px solid #e5e7eb' }} />
            <div>
              <button type="submit" style={{ height:44, padding:'0 18px', fontWeight:800, borderRadius:999, background:'linear-gradient(90deg,#0a4ea8,#0e6de6)', color:'#fff' }}>{lang==='vi'?'Gửi yêu cầu':'Send Request'}</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
