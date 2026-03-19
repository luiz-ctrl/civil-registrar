import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    api.get('/services').then(r => setServices(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const del = async id => {
    if (!confirm('Delete this service?')) return
    await api.delete(`/services/${id}`)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Services</h1><p>Civil registry services offered</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/services/new')}>
          <i className="bi bi-plus-lg"></i> New Service
        </button>
      </div>
      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Service Name</th><th>Description</th><th>Required Documents</th><th style={{textAlign:'right',paddingRight:'20px'}}>Actions</th></tr></thead>
              <tbody>
                {services.length === 0
                  ? <tr><td colSpan={5}><div className="empty-state"><i className="bi bi-grid-3x3-gap"></i><p>No services configured</p></div></td></tr>
                  : services.map(s => (
                  <tr key={s.id}>
                    <td className="text-muted" style={{fontWeight:700}}>#{s.id}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{width:'34px',height:'34px',borderRadius:'8px',background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <i className="bi bi-file-earmark-text" style={{color:'#7c3aed',fontSize:'15px'}}></i>
                        </div>
                        <span style={{fontWeight:600}}>{s.name}</span>
                      </div>
                    </td>
                    <td className="text-muted" style={{fontSize:'13px',maxWidth:'200px'}}>{s.description || '—'}</td>
                    <td className="text-muted" style={{fontSize:'13px',maxWidth:'240px'}}>{s.required_documents || '—'}</td>
                    <td>
                      <div style={{display:'flex',justifyContent:'flex-end',gap:'6px',paddingRight:'8px'}}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/services/${s.id}/edit`)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(s.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
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
