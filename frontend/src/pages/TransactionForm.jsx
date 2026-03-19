import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const EMPTY = { resident_name:'', transaction_type:'', service_id:'', status:'Pending', notes:'', visit_date: new Date().toISOString().split('T')[0] }

export default function TransactionForm() {
  const { id }            = useParams()
  const navigate          = useNavigate()
  const [form, setForm]   = useState(EMPTY)
  const [services, setServices] = useState([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data))
    if (isEdit) api.get(`/transactions`).then(r => {
      const t = r.data.find(x => x.id === parseInt(id))
      if (t) setForm({ resident_name: t.resident_name, transaction_type: t.transaction_type,
        service_id: t.service_id || '', status: t.status, notes: t.notes || '', visit_date: t.visit_date })
    })
  }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    const payload = { ...form, service_id: form.service_id ? parseInt(form.service_id) : null }
    try {
      if (isEdit) await api.put(`/transactions/${id}`, payload)
      else        await api.post('/transactions', payload)
      navigate('/admin/transactions')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit' : 'New'} Transaction</h1>
          <p>Fill in the transaction details below</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/admin/transactions')}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
      </div>

      <div className="card p-4" style={{maxWidth:'780px'}}>
        {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle"></i>{error}</div>}
        <form onSubmit={submit}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div className="form-group">
              <label className="form-label">Resident Name *</label>
              <input className="form-control" value={form.resident_name} required
                onChange={e => set('resident_name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Transaction Type *</label>
              <input className="form-control" value={form.transaction_type} required
                onChange={e => set('transaction_type', e.target.value)} placeholder="e.g. Birth Certificate Request" />
            </div>
            <div className="form-group">
              <label className="form-label">Service</label>
              <select className="form-select" value={form.service_id} onChange={e => set('service_id', e.target.value)}>
                <option value="">No specific service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {['Pending','Processing','Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visit Date *</label>
              <input type="date" className="form-control" value={form.visit_date} required
                onChange={e => set('visit_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes <span className="text-muted" style={{fontWeight:400}}>(optional)</span></label>
            <textarea className="form-control" rows={3} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Additional notes…" />
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/transactions')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="bi bi-save"></i> {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
