import { useEffect, useState } from 'react'
import api from '../utils/api'
import './Landing.css'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || ''

export default function Landing() {
  const [services, setServices]           = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [achievements, setAchievements]   = useState([])
  const [mobileOpen, setMobileOpen]       = useState(false)
  const [openAccordion, setOpenAccordion] = useState(null)

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data)).catch(() => {})
    api.get('/announcements?active=1').then(r => setAnnouncements(r.data)).catch(() => {})
    api.get('/achievements?active=1').then(r => setAchievements(r.data)).catch(() => {})
  }, [])

  const serviceIcon = name => {
    const n = (name||'').toLowerCase()
    if (n.includes('birth'))      return 'bi-person-plus-fill'
    if (n.includes('marriage'))   return 'bi-hearts'
    if (n.includes('death'))      return 'bi-flower1'
    if (n.includes('correction')) return 'bi-pencil-square'
    return 'bi-file-earmark-text-fill'
  }

  return (
    <div className="public-site">
      {/* Navbar */}
      <nav className="pub-nav">
        <div className="pub-container pub-nav-inner">
          <a href="/" className="pub-brand">
            <div className="pub-brand-icon">CR</div>
            <div>
              <div className="pub-brand-name">Municipal Civil Registrar</div>
              <div className="pub-brand-sub">General Luna, Quezon</div>
            </div>
          </a>
          <ul className="pub-links">
            {['home','services','requirements','achievements','announcements','contact'].map(s => (
              <li key={s}><a href={`#${s}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</a></li>
            ))}
          </ul>
          <button className="pub-toggler" onClick={() => setMobileOpen(o => !o)}>
            <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
        </div>
        {mobileOpen && (
          <div className="pub-mobile-nav pub-container">
            {['home','services','requirements','achievements','announcements','contact'].map(s => (
              <a key={s} href={`#${s}`} onClick={() => setMobileOpen(false)}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="hero">
        <div className="pub-container">
          <div className="hero-eyebrow"><span></span> Official Government Office</div>
          <h1>Welcome to the<br/>Civil Registrar Office</h1>
          <p>Providing efficient, citizen-centered services for the registration and issuance of vital civil documents — birth, marriage, death certificates, corrections, and certified copies.</p>
          <div className="hero-btns">
            <a href="#services" className="hero-btn-primary"><i className="bi bi-grid-3x3-gap-fill"></i> View Services</a>
            <a href="#contact" className="hero-btn-outline"><i className="bi bi-geo-alt"></i> Find Us</a>
          </div>
          <div className="hero-stats">
            <div><div className="hero-stat-num">5+</div><div className="hero-stat-label">Core Services</div></div>
            <div><div className="hero-stat-num">Mon–Fri</div><div className="hero-stat-label">Office Hours</div></div>
            <div><div className="hero-stat-num">1995+</div><div className="hero-stat-label">Records Available</div></div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="pub-section">
        <div className="pub-container">
          <div className="section-head">
            <div className="section-label">What We Offer</div>
            <h2 className="section-title">Our Services</h2>
            <p className="section-sub">Fast, reliable civil registry services for every resident of General Luna, Quezon.</p>
          </div>
          <div className="services-grid">
            {services.map(s => (
              <div key={s.id} className="service-card">
                <div className="service-icon-wrap"><i className={`bi ${serviceIcon(s.name)}`}></i></div>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>

          {/* Records */}
          <div style={{marginTop:'48px'}}>
            <div className="section-label">Archive</div>
            <h3 className="section-title" style={{fontSize:'1.4rem'}}>Records Available</h3>
            <div className="records-grid">
              {[
                {title:'Birth Records', icon:'bi-person-plus-fill', years:['1954*','1959*','1960–1963*','1965–1969*','1970–1979*','1980–1985*','1987–1988*','1990–1991*','1994*','1995 to Present']},
                {title:'Marriage Records', icon:'bi-hearts', years:['1970–1979*','1980–1985*','1986–1989*','1990–1991*','1994*','1995 to Present']},
                {title:'Death Records', icon:'bi-flower1', years:['1984*','1990*','1991*','1992*','1993*','1994*','1995 to Present']},
              ].map(r => (
                <div key={r.title} className="records-card">
                  <div className="records-header">
                    <div className="records-icon"><i className={`bi ${r.icon}`}></i></div>
                    <h4>{r.title}</h4>
                  </div>
                  <div className="records-body">
                    {r.years.map(y => <span key={y} className={`year-tag${y.includes('*') ? ' limited' : ''}`}>{y}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section id="requirements" className="pub-section pub-section-alt">
        <div className="pub-container">
          <div className="section-head">
            <div className="section-label">Before You Visit</div>
            <h2 className="section-title">Document Requirements</h2>
            <p className="section-sub">Prepare these documents before visiting the office to avoid delays.</p>
          </div>
          <div style={{maxWidth:'680px',margin:'0 auto'}}>
            {services.map(s => (
              <div key={s.id} className="accordion-item">
                <button className={`accordion-btn ${openAccordion === s.id ? 'open' : ''}`}
                  onClick={() => setOpenAccordion(openAccordion === s.id ? null : s.id)}>
                  <span>{s.name}</span>
                  <i className={`bi bi-chevron-${openAccordion === s.id ? 'up' : 'down'}`}></i>
                </button>
                {openAccordion === s.id && (
                  <div className="accordion-body">
                    {s.required_documents
                      ? <ul>{s.required_documents.split(';').map((d,i) => <li key={i}>{d.trim()}</li>)}</ul>
                      : <p style={{color:'var(--text-muted)'}}>Please contact the office for the latest requirements.</p>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section id="achievements" className="pub-section">
        <div className="pub-container">
          <div className="section-head">
            <div className="section-label">Recognition</div>
            <h2 className="section-title">Achievements Corner</h2>
          </div>
          <div className="cards-grid">
            {achievements.length === 0
              ? <p style={{color:'var(--text-muted)'}}>No achievements posted yet.</p>
              : achievements.map(a => (
              <div key={a.id} className="achievement-card">
                <div className="achievement-badge"><i className="bi bi-award-fill"></i></div>
                <div className="achievement-date">{a.achieved_on ? new Date(a.achieved_on).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}) : ''}</div>
                <h3>{a.title}</h3>
                <p>{a.description || 'Achievement details will be posted soon.'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section id="announcements" className="pub-section pub-section-alt">
        <div className="pub-container">
          <div className="section-head">
            <div className="section-label">Latest News</div>
            <h2 className="section-title">Announcements</h2>
          </div>
          <div className="cards-grid">
            {announcements.length === 0
              ? <p style={{color:'var(--text-muted)'}}>No announcements at the moment.</p>
              : announcements.map(a => (
              <a key={a.id} href={`/announcement/${a.id}`} className="ann-card">
                {a.image
                  ? <img src={`${API_BASE}/uploads/announcements/${a.image}`} className="ann-img" alt={a.title} />
                  : <div className="ann-img-placeholder"><i className="bi bi-megaphone"></i></div>
                }
                <div className="ann-body">
                  <div className="ann-date">{new Date(a.created_at).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}</div>
                  <h3>{a.title}</h3>
                  <p>{a.content.slice(0,110)}{a.content.length > 110 ? '…' : ''}</p>
                  <div className="ann-more">Read more <i className="bi bi-arrow-right"></i></div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="pub-section">
        <div className="pub-container">
          <div className="section-head">
            <div className="section-label">Visit Us</div>
            <h2 className="section-title">Contact & Location</h2>
          </div>
          <div className="contact-grid">
            <div className="contact-info">
              {[
                {icon:'bi-geo-alt-fill', label:'Office Address', value:'M5QC+8CX, Jacinto, Poblacion,\nGeneral Luna, Quezon'},
                {icon:'bi-telephone-fill', label:'Phone', value:'(012) 345-6789'},
                {icon:'bi-clock-fill', label:'Office Hours', value:'Monday – Friday\n8:00 AM – 5:00 PM'},
                {icon:'bi-info-circle-fill', label:'Note', value:'Closed on weekends and public holidays.'},
              ].map(c => (
                <div key={c.label} className="contact-row">
                  <div className="contact-icon"><i className={`bi ${c.icon}`}></i></div>
                  <div>
                    <strong>{c.label}</strong>
                    <span style={{whiteSpace:'pre-line'}}>{c.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="map-wrap">
              <iframe src="https://www.google.com/maps?q=M5QC%2B8CX%20Jacinto%20Poblacion%20General%20Luna%20Quezon&output=embed"
                width="100%" height="100%" style={{border:0,minHeight:'320px'}} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" title="Office Location"></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pub-footer">
        <div className="pub-container">
          <p><strong>Municipal Civil Registrar Office</strong> — General Luna, Quezon</p>
          <p>&copy; {new Date().getFullYear()} All rights reserved. &nbsp;·&nbsp; Mon–Fri 8:00 AM – 5:00 PM</p>
        </div>
      </footer>
    </div>
  )
}
