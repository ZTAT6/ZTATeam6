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
          <a href="#" onClick={(e)=>{e.preventDefault(); nav('/auth')}}>{t('login')}</a>
          <a href="#" onClick={(e)=>{e.preventDefault(); nav('/auth')}}>{t('signup')}</a>
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
          { key: 'menu_fee', to: '#' },
          { key: 'menu_exam', to: '#' },
          { key: 'menu_support', to: '#' },
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
            <button className="cta" onClick={()=>nav('/auth')}>{t('cta_explore')}</button>
            <div className="badges">
              <span className="badge">{lang==='vi'?'Giảng viên uy tín':'Trusted Instructors'}</span>
              <span className="badge">{lang==='vi'?'Lộ trình rõ ràng':'Clear Roadmaps'}</span>
              <span className="badge">{lang==='vi'?'Hỗ trợ 24/7':'24/7 Support'}</span>
            </div>
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

          {/* Features grid */}
          <section className="hm-features">
            {[
              { title: lang==='vi'?'Nội dung bám sát':'Aligned Content', desc: lang==='vi'?'Bám sát chương trình, dễ hiểu, sinh động.':'Curriculum-aligned, simple, engaging.' },
              { title: lang==='vi'?'Cá nhân hoá':'Personalized', desc: lang==='vi'?'Lộ trình tuỳ trình độ, nhắc nhở thông minh.':'Adaptive paths, smart reminders.' },
              { title: lang==='vi'?'Thi thử chuẩn':'Mock Exams', desc: lang==='vi'?'Đề thi chuẩn, giải chi tiết, chấm điểm nhanh.':'Standardized tests, detailed solutions.' },
              { title: lang==='vi'?'Theo dõi tiến độ':'Progress', desc: lang==='vi'?'Biểu đồ trực quan, mục tiêu rõ ràng.':'Visual charts, clear goals.' },
            ].map((f,i)=> (
              <div key={i} className="feature">
                <div className="icon" />
                <div>
                  <div className="title">{f.title}</div>
                  <div className="desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </section>

          {/* Stats + CTA */}
          <section className="hm-stats">
            <div className="card">
              <div className="num">50k+</div>
              <div className="label">{lang==='vi'?'Học viên':'Learners'}</div>
            </div>
            <div className="card">
              <div className="num">1k+</div>
              <div className="label">{lang==='vi'?'Đề thi':'Exam sets'}</div>
            </div>
            <div className="card">
              <div className="num">95%</div>
              <div className="label">{lang==='vi'?'Hài lòng':'Satisfaction'}</div>
            </div>
            <div className="cta-wrap">
              <div className="text">{lang==='vi'?'Bắt đầu hành trình học hiệu quả ngay hôm nay!':'Start your effective learning journey today!'}</div>
              <button onClick={()=>nav('/auth')}>{lang==='vi'?'Đăng ký':'Sign Up'}</button>
            </div>
          </section>
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

      {/* Testimonials */}
      <section className="hm-testimonials">
        {[
          { quote: lang==='vi'?'Nội dung dễ hiểu, tiến bộ rõ rệt sau 2 tháng.':'Clear content, visible progress after 2 months.', name: 'Minh – Học viên' },
          { quote: lang==='vi'?'Thi thử bám sát, tự tin vào phòng thi.':'Mock exams aligned, confident in the exam.', name: 'Lan – Học viên' },
          { quote: lang==='vi'?'Giảng viên tận tâm, hỗ trợ nhanh.':'Dedicated instructors, fast support.', name: 'Thắng – Phụ huynh' },
        ].map((tst,i)=> (
          <div key={i} className="t-item">
            <div className="quote">“{tst.quote}”</div>
            <div className="author">{tst.name}</div>
          </div>
        ))}
      </section>

      {/* Partners */}
      <section className="hm-partners">
        {[1,2,3,4,5].map((i)=> (
          <div key={i} className="p-logo" />
        ))}
      </section>

      {/* Footer */}
      <footer className="hm-footer">
        <div className="links">
          <a href="#" onClick={(e)=>e.preventDefault()}>{lang==='vi'?'Điều khoản':'Terms'}</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>{lang==='vi'?'Bảo mật':'Privacy'}</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>{lang==='vi'?'Liên hệ':'Contact'}</a>
        </div>
        <div className="copy">© {new Date().getFullYear()} {t('brand')}</div>
      </footer>

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