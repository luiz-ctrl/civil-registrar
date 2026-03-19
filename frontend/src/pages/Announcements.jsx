import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || ''

export default function Announcements() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    api.get('/announcements').then(r => setItems(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const del = async id => {
    if (!confirm('Delete this announcement?')) return
    await api.delete(`/announcements/${id}`)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Announcements</h1><p>Manage public announcements</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/announcements/new')}>
          <i className="bi bi-plus-lg"></i> New Announcement
        </button>
      </div>
      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Photo</th><th>Title</th><th>Status</th><th>Created</th><th>Updated</th><th style={{textAlign:'right',paddingRight:'20px'}}>Actions</th></tr></thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan={7}><div className="empty-state"><i className="bi bi-megaphone"></i><p>No announcements yet</p></div></td></tr>
                  : items.map(a => (
                  <tr key={a.id}>
                    <td className="text-muted" style={{fontWeight:700}}>#{a.id}</td>
                    <td>
                      {a.image
                        ? <img src={`${API_BASE}/uploads/announcements/${a.image}`} style={{width:'56px',height:'42px',objectFit:'cover',borderRadius:'6px',border:'1px solid var(--border)'}} alt="" />
                        : <div style={{width:'56px',height:'42px',borderRadius:'6px',background:'#f1f5f9',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <i className="bi bi-image" style={{color:'#94a3b8'}}></i>
                          </div>
                      }
                    </td>
                    <td style={{fontWeight:600}}>{a.title}</td>
                    <td>
                      {a.is_active
                        ? <span className="badge badge-success">● Active</span>
                        : <span className="badge badge-secondary">○ Inactive</span>}
                    </td>
                    <td className="text-muted">{new Date(a.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td className="text-muted">{new Date(a.updated_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td>
                      <div style={{display:'flex',justifyContent:'flex-end',gap:'6px',paddingRight:'8px'}}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/announcements/${a.id}/edit`)}><i className="bi bi-pencil"></i></button>
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
