import React, { useEffect, useState } from 'react'
import '../home.css'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function Home() {
  const nav = useNavigate()
  const { lang, t, setLang } = useI18n()
  const [query, setQuery] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  useEffect(() => {
    // mark body for page-specific styling
    document.body.classList.add('home')
    return () => document.body.classList.remove('home')
  }, [])

  return (
    <div>
      {/* Header */}
      <header className="hm-header">
        <div className="hm-brand" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
          <div className="hm-logo">
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M12 3L3 8l9 5 9-5-9-5Z" />
              <path d="M5 10v5c0 1.5 3.5 3.5 7 3.5s7-2 7-3.5v-5" />
              <path d="M18 10v5l-2 2" />
            </svg>
          </div>
          <div className="hm-title">{t('brand')}</div>
        </div>
        <div className="hm-auth">
          <a href="#" onClick={(e)=>{e.preventDefault(); nav('/login')}}>{t('login')}</a>
          <a href="#" onClick={(e)=>{e.preventDefault(); nav('/login')}}>{t('signup')}</a>
          <span style={{ marginLeft: 12, color: '#666', fontWeight: 600 }}>{t('lang_label')}:</span>
          <select value={lang} onChange={(e)=>setLang(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
        </div>
      </header>

      {/* Nav */}
      <nav className="hm-nav">
        {[
          { key: 'menu_intro', to: '/about' },
          { key: 'menu_courses', to: '/courses' },
          { key: 'menu_teachers', to: '#' },
          { key: 'menu_fee', to: '/fee' },
          { key: 'menu_exam', to: '#' },
          { key: 'menu_support', to: '/support' },
        ].map((item,i)=>(
          <a key={i} href="#" onClick={(e)=>{e.preventDefault(); if (item.to !== '#') nav(item.to)}}>{t(item.key)}</a>
        ))}
      </nav>

      {/* Main content */}
      <main className="hm-container">
        {/* Left: hero + banners */}
        <div>
          <section className="hm-hero">
            <h1>{t('hero_title_generic')}</h1>
            <p>{t('hero_desc_generic')}</p>
            <button className="cta" onClick={()=>nav('/login')}>{t('cta_explore')}</button>
          </section>

          <div className="hm-banners">
            <div className="hm-banner">
              <h4>{t('banner1_title')}</h4>
              <p>{t('banner1_desc')}</p>
            </div>
            <div className="hm-banner">
              <h4>{t('banner2_title')}</h4>
              <p>{t('banner2_desc')}</p>
            </div>
            <div className="hm-banner">
              <h4>{t('banner3_title')}</h4>
              <p>{t('banner3_desc')}</p>
            </div>
          </div>

          <div className="hm-search">
            <input placeholder={t('search_placeholder')} value={query} onChange={(e)=>setQuery(e.target.value)} />
            <button onClick={()=> alert(`${t('search_btn')}: ${query || ''}`)}>{t('search_btn')}</button>
          </div>

          <div className="hm-social">
            <span>{t('social_like')}</span>
            <span className="count">{t('social_count')}</span>
          </div>
        </div>

        {/* Right: news */}
        <aside className="hm-news">
          <h3>{t('news_title')}</h3>
          <ul>
            {[
              lang==='vi' ? 'Ra mắt lộ trình tổng ôn cho học sinh cuối cấp' : 'Launch: comprehensive review roadmap for final-year students',
              lang==='vi' ? 'Cẩm nang phụ huynh: học online an toàn & hiệu quả' : 'Parents guide: safe & effective online learning',
              lang==='vi' ? 'PEN 2019: 1000+ đề thi bám sát chuẩn' : 'PEN 2019: 1000+ standardized exam sets',
              lang==='vi' ? 'Cập nhật điểm chuẩn dự kiến THPTQG 2019' : 'Update: expected national exam cutoff scores',
            ].map((t,i)=> (
              <li key={i}><a href="#" onClick={(e)=>e.preventDefault()}>{t}</a></li>
            ))}
          </ul>
        </aside>
      </main>

      {/* Chat bubble */}
      <div className="hm-chat">
        <div className="label" onClick={()=>setChatOpen(v=>!v)} style={{ cursor:'pointer' }}>{t('chat_greet')}</div>
        {chatOpen && (
          <div style={{ marginTop: 8 }}>
            <input style={{ width: 220, height: 34, border:'1px solid #e5e7eb', borderRadius: 8, padding: '0 10px' }} placeholder={lang==='vi'?'Nhập tin nhắn...':'Type a message...'} />
            <button style={{ marginLeft: 8, height: 34 }} onClick={()=>alert(lang==='vi'?'Đã gửi!':'Sent!')}>{lang==='vi'?'Gửi':'Send'}</button>
          </div>
        )}
      </div>
      
      <footer className="hm-footer">
        <div className="ft-brand">
          <div className="ft-name">BEC FPT BRITISH COLLEGE</div>
        </div>
        <div className="ft-info">
          <div className="line">14 Trinh Van Bo ,Nam Tu Niem ,Thanh pho Ha Noi</div>
          <div className="line">Phone: 0877389302</div>
          <div className="line">Email: tt6220389@gmail.com</div>
          <div className="line">BEC FPT BRITISH COLLEGE</div>
          <div className="line">Developed by ZTATEAM6</div>
        </div>
        <div className="ft-social">
          <a href="#" aria-label="Facebook" className="icon">
            <svg viewBox="0 0 24 24"><path d="M14 8h2V5h-2c-2 0-3 1-3 3v2H9v3h2v6h3v-6h2l1-3h-3V8c0-.6.4-1 1-1Z"/></svg>
          </a>
          <a href="#" aria-label="YouTube" className="icon">
            <svg viewBox="0 0 24 24"><path d="M22 12s0-4-1-5-4-1-4-1H7s-3 0-4 1-1 5-1 5 0 4 1 5 4 1 4 1h10s3 0 4-1 1-5 1-5Z"/><path d="M10 15V9l6 3-6 3Z"/></svg>
          </a>
          <a href="#" aria-label="Spotify" className="icon">
            <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 .001 18.001A9 9 0 0 0 12 3Zm4.7 12.7c-.3.5-.9.7-1.4.4-2.6-1.6-5.9-2-9.8-1.2-.6.1-1.1-.3-1.2-.9s.3-1.1.9-1.2c4.3-.9 8-.4 10.9 1.4.5.3.7.9.4 1.5Zm1.3-3.1c-.3.5-.9.7-1.4.4-3-1.8-7.5-2.3-10.9-1.4-.6.1-1.1-.2-1.3-.8-.1-.6.2-1.1.8-1.3 3.8-.9 8.7-.3 12.1 1.7.5.3.7.9.4 1.4Zm.1-3.4c-.3.5-1 .6-1.5.3-3.5-2.1-9.3-2.3-12.7-1.4-.6.1-1.2-.2-1.3-.8-.2-.6.2-1.2.8-1.3 3.9-1 10.2-.7 14.2 1.7.5.3.7 1 .5 1.5Z"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn" className="icon">
            <svg viewBox="0 0 24 24"><path d="M4 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3 9h3v12H3V9Zm6 0h3v2.2h.1c.4-.8 1.5-2.2 3.6-2.2 3.8 0 4.5 2.5 4.5 5.7V21h-3v-5.1c0-1.2 0-2.8-1.7-2.8-1.7 0-2 1.3-2 2.7V21h-3V9Z"/></svg>
          </a>
          <a href="#" aria-label="Instagram" className="icon">
            <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.2"/></svg>
          </a>
          <a href="#" aria-label="TikTok" className="icon">
            <svg viewBox="0 0 24 24"><path d="M16 4c1 1.5 2.4 2.4 4 2.7v3c-1.9-.3-3.3-1-4-1.6V15a5 5 0 1 1-5-5h1v3h-1a2 2 0 1 0 2 2V4h3Z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  )
}
