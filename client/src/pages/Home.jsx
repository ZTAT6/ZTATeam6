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
          <div className="hm-logo" />
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
    </div>
  )
}