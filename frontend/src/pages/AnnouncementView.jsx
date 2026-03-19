import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || ''

export default function AnnouncementView() {
  const { id }            = useParams()
  const navigate          = useNavigate()
  const [ann, setAnn]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/announcements/${id}`).then(r => setAnn(r.data)).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner" /></div>
  if (!ann)    return null

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",minHeight:'100vh',background:'#f9fafb'}}>
      <nav style={{background:'rgba(255,255,255,0.96)',backdropFilter:'blur(10px)',borderBottom:'1px solid #e5e7eb',position:'sticky',top:0,zIndex:100,padding:'0 24px',height:'64px',display:'flex',alignItems:'center',gap:'12px'}}>
        <button onClick={() => navigate('/')} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'6px 12px',fontSize:'13px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',color:'#374151'}}>
          <i className="bi bi-arrow-left"></i> Back to Home
        </button>
      </nav>

      <div style={{maxWidth:'780px',margin:'0 auto',padding:'48px 24px'}}>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.06)'}}>
          {ann.image && (
            <img src={`${API_BASE}/uploads/announcements/${ann.image}`}
              style={{width:'100%',maxHeight:'360px',objectFit:'cover',display:'block'}} alt={ann.title} />
          )}
          <div style={{padding:'36px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'#1a56db',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'12px'}}>
              {new Date(ann.created_at).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}
            </div>
            <h1 style={{fontSize:'clamp(1.5rem,4vw,2rem)',fontWeight:800,color:'#111928',lineHeight:1.2,marginBottom:'20px'}}>{ann.title}</h1>
            <p style={{fontSize:'15.5px',color:'#374151',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{ann.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
