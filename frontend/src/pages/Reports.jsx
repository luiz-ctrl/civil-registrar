import { useState } from 'react'
import api from '../utils/api'
import { StatusBadge } from './Dashboard'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function Reports() {
  const [filters, setFilters]     = useState({ start:'', end:'' })
  const [transactions, setTxns]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)

  const set = (k,v) => setFilters(f => ({...f,[k]:v}))

  const generate = async e => {
    e.preventDefault(); setLoading(true); setSearched(true)
    const params = {}
    if (filters.start) params.start = filters.start
    if (filters.end)   params.end   = filters.end
    api.get('/reports/transactions', { params }).then(r => setTxns(r.data)).finally(() => setLoading(false))
  }

  const csvUrl = () => {
    const p = new URLSearchParams()
    if (filters.start) p.set('start', filters.start)
    if (filters.end)   p.set('end',   filters.end)
    return `${API_BASE}/reports/transactions.csv?${p}`
  }
  const pdfUrl = () => {
    const p = new URLSearchParams()
    if (filters.start) p.set('start', filters.start)
    if (filters.end)   p.set('end',   filters.end)
    return `${API_BASE}/reports/transactions.pdf?${p}`
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Reports & Exports</h1><p>Filter, preview and download transaction data</p></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'20px',alignItems:'start'}}>
        {/* Left column */}
        <div>
          <div className="card p-4 mb-3">
            <div style={{fontWeight:700,fontSize:'14px',marginBottom:'16px',color:'#0f172a',display:'flex',alignItems:'center',gap:'8px'}}>
              <i className="bi bi-funnel" style={{color:'var(--primary)'}}></i> Date Filter
            </div>
            <form onSubmit={generate}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" value={filters.start} onChange={e => set('start', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-control" value={filters.end} onChange={e => set('end', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>
                <i className="bi bi-search"></i> Generate Preview
              </button>
            </form>
          </div>

          <div className="card p-4">
            <div style={{fontWeight:700,fontSize:'14px',marginBottom:'4px',color:'#0f172a',display:'flex',alignItems:'center',gap:'8px'}}>
              <i className="bi bi-download" style={{color:'#22c55e'}}></i> Export
            </div>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',marginBottom:'12px'}}>Downloads use the current filter range.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              <a className="btn btn-outline" style={{justifyContent:'flex-start'}} href={csvUrl()} target="_blank" rel="noreferrer">
                <i className="bi bi-filetype-csv" style={{color:'#22c55e'}}></i> Transactions CSV
              </a>
              <a className="btn btn-outline" style={{justifyContent:'flex-start'}} href={pdfUrl()} target="_blank" rel="noreferrer">
                <i className="bi bi-filetype-pdf" style={{color:'#dc2626'}}></i> Transactions PDF
              </a>
              <a className="btn btn-outline" style={{justifyContent:'flex-start'}} href={`${API_BASE}/reports/top-services.csv`} target="_blank" rel="noreferrer">
                <i className="bi bi-bar-chart" style={{color:'var(--primary)'}}></i> Top Services CSV
              </a>
            </div>
          </div>
        </div>

        {/* Preview table */}
        <div className="card">
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:700,fontSize:'14px',color:'#0f172a'}}>Transaction Preview</div>
            {searched && <span className="badge badge-info">{transactions.length} record{transactions.length !== 1 ? 's' : ''}</span>}
          </div>
          {loading ? <div className="spinner" /> : (
            <div className="table-wrap" style={{maxHeight:'500px',overflowY:'auto'}}>
              <table>
                <thead style={{position:'sticky',top:0,zIndex:1}}>
                  <tr><th>ID</th><th>Date</th><th>Resident</th><th>Type</th><th>Service</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <i className="bi bi-calendar-x"></i>
                        <p>{searched ? 'No results for this date range.' : 'Select a date range and click Generate Preview.'}</p>
                      </div>
                    </td></tr>
                  ) : transactions.map(t => (
                    <tr key={t.id}>
                      <td className="text-muted" style={{fontWeight:700}}>#{t.id}</td>
                      <td className="text-muted">{new Date(t.visit_date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                      <td style={{fontWeight:600}}>{t.resident_name}</td>
                      <td className="text-muted">{t.transaction_type}</td>
                      <td>{t.service_name || '—'}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
