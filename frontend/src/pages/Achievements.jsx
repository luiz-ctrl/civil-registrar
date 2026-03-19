import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Achievements() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    api.get('/achievements').then(r => setItems(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const del = async id => {
    if (!confirm('Delete this achievement?')) return
    await api.delete(`/achievements/${id}`)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Achievements</h1><p>Office milestones and recognitions</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/achievements/new')}>
          <i className="bi bi-plus-lg"></i> New Achievement
        </button>
      </div>
      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Achievement</th><th>Date Achieved</th><th>Status</th><th>Created</th><th style={{textAlign:'right',paddingRight:'20px'}}>Actions</th></tr></thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan={6}><div className="empty-state"><i className="bi bi-award"></i><p>No achievements yet</p></div></td></tr>
                  : items.map(a => (
                  <tr key={a.id}>
                    <td className="text-muted" style={{fontWeight:700}}>#{a.id}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{width:'34px',height:'34px',borderRadius:'8px',background:'linear-gradient(135deg,#fef9c3,#fde68a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <i className="bi bi-award-fill" style={{color:'#d97706',fontSize:'15px'}}></i>
                        </div>
                        <div>
                          <div style={{fontWeight:600}}>{a.title}</div>
                          {a.description && <div style={{fontSize:'12px',color:'var(--text-muted)',maxWidth:'300px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{a.achieved_on ? new Date(a.achieved_on).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—'}</td>
                    <td>
                      {a.is_active
                        ? <span className="badge badge-success">● Active</span>
                        : <span className="badge badge-secondary">○ Inactive</span>}
                    </td>
                    <td className="text-muted">{new Date(a.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td>
                      <div style={{display:'flex',justifyContent:'flex-end',gap:'6px',paddingRight:'8px'}}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/achievements/${a.id}/edit`)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(a.id)}><i className="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
