import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function Support() {
  const nav = useNavigate()
  const { t, lang, setLang } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => { document.body.classList.remove('home') }, [])

  function submit() {
    if (!name || !email || !message) return alert(lang==='vi'?'Vui lòng điền đầy đủ thông tin':'Please fill in all fields')
    alert(t('support_success'))
    setName(''); setEmail(''); setMessage('')
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

      <section className="about-hero">
        <h1 style={{ marginTop: 0 }}>{t('support_title')}</h1>
        <p>{t('support_desc')}</p>
      </section>

      <div className="panel" style={{ marginTop: 14 }}>
        <h2 className="panel-title">{t('support_contact_title')}</h2>
        <div className="support-form">
          <div className="field"><input type="text" placeholder={lang==='vi'?'Họ và tên':'Full name'} value={name} onChange={(e)=>setName(e.target.value)} /></div>
          <div className="field"><input type="email" placeholder={t('emailAddress')} value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
          <div className="field"><textarea placeholder={lang==='vi'?'Nội dung cần hỗ trợ':'How can we help?'} value={message} onChange={(e)=>setMessage(e.target.value)} /></div>
          <div><button onClick={submit}>{t('support_submit')}</button></div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h2 className="panel-title">{t('support_faq_title')}</h2>
        <div className="faq-list">
          <div className="faq-item">
            <div className="q">{t('support_faq_1_q')}</div>
            <div className="a">{t('support_faq_1_a')}</div>
          </div>
          <div className="faq-item">
            <div className="q">{t('support_faq_2_q')}</div>
            <div className="a">{t('support_faq_2_a')}</div>
          </div>
          <div className="faq-item">
            <div className="q">{t('support_faq_3_q')}</div>
            <div className="a">{t('support_faq_3_a')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}