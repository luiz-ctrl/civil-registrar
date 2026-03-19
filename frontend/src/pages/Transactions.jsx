import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { StatusBadge } from './Dashboard'

export default function Transactions() {
  const [txns, setTxns]         = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ q:'', service_id:'', status:'', start_date:'', end_date:'' })
  const navigate = useNavigate()

  const load = (f = filters) => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(f).filter(([,v]) => v))
    api.get('/transactions', { params }).then(r => setTxns(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data))
    load()
  }, [])

  const del = async id => {
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/transactions/${id}`)
    load()
  }

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <div><h1>Transactions</h1><p>Manage all resident transactions</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/transactions/new')}>
          <i className="bi bi-plus-lg"></i> New Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4 p-3">
        <div className="filter-grid">
          <div>
            <label className="form-label">Search</label>
            <input className="form-control" placeholder="Resident name…"
              value={filters.q} onChange={e => set('q', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Service</label>
            <select className="form-select" value={filters.service_id} onChange={e => set('service_id', e.target.value)}>
              <option value="">All Services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.status} onChange={e => set('status', e.target.value)}>
              <option value="">All Status</option>
              {['Pending','Processing','Completed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-control" value={filters.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-control" value={filters.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'8px'}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={() => load()}>
              <i className="bi bi-funnel"></i>
            </button>
            <button className="btn btn-outline" onClick={() => { const f={q:'',service_id:'',status:'',start_date:'',end_date:''}; setFilters(f); load(f) }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Resident</th><th>Type</th><th>Service</th>
                  <th>Status</th><th>Visit Date</th><th>Created</th>
                  <th style={{textAlign:'right',paddingRight:'20px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {txns.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><i className="bi bi-inbox"></i><p>No transactions found</p></div></td></tr>
                ) : txns.map(t => (
                  <tr key={t.id}>
                    <td className="text-muted" style={{fontWeight:700}}>#{t.id}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'#e0e7ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'#4f46e5',flexShrink:0}}>
                          {t.resident_name[0]?.toUpperCase()}
                        </div>
                        <span style={{fontWeight:600}}>{t.resident_name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{t.transaction_type}</td>
                    <td>{t.service_name
                      ? <span style={{background:'#f1f5f9',color:'#475569',padding:'2px 8px',borderRadius:'6px',fontSize:'12px'}}>{t.service_name}</span>
                      : <span className="text-muted">—</span>}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-muted">{new Date(t.visit_date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td className="text-muted">{new Date(t.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td>
                      <div style={{display:'flex',justifyContent:'flex-end',gap:'6px',paddingRight:'8px'}}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/transactions/${t.id}/edit`)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <a className="btn btn-outline btn-sm" href={`/api/transactions/${t.id}/qr`} target="_blank" rel="noreferrer" title="QR Code">
                          <i className="bi bi-qr-code"></i>
                        </a>
                        <button className="btn btn-danger btn-sm" onClick={() => del(t.id)}>
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

      <style>{`.filter-grid{display:grid;grid-template-columns:2fr 2fr 1.5fr 1.5fr 1.5fr 1fr;gap:12px;align-items:end}@media(max-width:900px){.filter-grid{grid-template-columns:1fr 1fr}}`}</style>
    </div>
  )
}
