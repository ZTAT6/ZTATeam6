import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function Fee() {
  const nav = useNavigate()
  const { t, lang, setLang } = useI18n()
  useEffect(() => { document.body.classList.remove('home') }, [])
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
        <h1 style={{ marginTop: 0 }}>{t('fee_title')}</h1>
        <p>{t('fee_desc')}</p>
      </section>

      <div className="pricing-table">
        <div className="plan">
          <div className="plan-name">{t('fee_plan_basic')}</div>
          <div className="price">{t('fee_price_basic')}</div>
          <ul className="features">
            <li>{lang==='vi'?'Truy cập khoá cơ bản':'Access to basic courses'}</li>
            <li>{lang==='vi'?'Hỗ trợ qua email':'Email support'}</li>
          </ul>
          <button onClick={()=>alert(t('fee_enroll'))}>{t('fee_enroll')}</button>
        </div>
        <div className="plan popular">
          <div className="plan-name">{t('fee_plan_premium')}</div>
          <div className="price">{t('fee_price_premium')}</div>
          <ul className="features">
            <li>{lang==='vi'?'Tất cả khoá học tiêu biểu':'All featured courses'}</li>
            <li>{lang==='vi'?'Bài kiểm tra định kỳ':'Periodic assessments'}</li>
            <li>{lang==='vi'?'Hỗ trợ trực tuyến nhanh':'Fast online support'}</li>
          </ul>
          <button onClick={()=>alert(t('fee_enroll'))}>{t('fee_enroll')}</button>
        </div>
        <div className="plan">
          <div className="plan-name">{t('fee_plan_pro')}</div>
          <div className="price">{t('fee_price_pro')}</div>
          <ul className="features">
            <li>{lang==='vi'?'Cố vấn học tập 1:1':'1:1 learning coach'}</li>
            <li>{lang==='vi'?'Lộ trình cá nhân hoá nâng cao':'Advanced personalized roadmap'}</li>
            <li>{lang==='vi'?'Ưu tiên hỗ trợ 24/7':'Priority 24/7 support'}</li>
          </ul>
          <button onClick={()=>alert(t('fee_enroll'))}>{t('fee_enroll')}</button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h2 className="panel-title">{t('fee_methods_title')}</h2>
        <div className="methods-grid">
          <div className="method-card">{t('fee_methods_cards')}</div>
          <div className="method-card">{t('fee_methods_bank')}</div>
          <div className="method-card">{t('fee_methods_momo')}</div>
        </div>
        <div style={{ marginTop: 8, color:'#6b7280' }}>{t('fee_billing_note')}</div>
      </div>
    </div>
  )
}