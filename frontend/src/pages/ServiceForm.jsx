import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const EMPTY = { name:'', description:'', required_documents:'' }

export default function ServiceForm() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) api.get('/services').then(r => {
      const s = r.data.find(x => x.id === parseInt(id))
      if (s) setForm({ name: s.name, description: s.description || '', required_documents: s.required_documents || '' })
    })
  }, [id])

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (isEdit) await api.put(`/services/${id}`, form)
      else        await api.post('/services', form)
      navigate('/admin/services')
    } catch (err) { setError(err.response?.data?.error || 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>{isEdit ? 'Edit' : 'New'} Service</h1><p>Fill in the service details</p></div>
        <button className="btn btn-outline" onClick={() => navigate('/admin/services')}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
      </div>
      <div className="card p-4" style={{maxWidth:'680px'}}>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input className="form-control" value={form.name} required
              onChange={e => set('name', e.target.value)} placeholder="e.g. Birth Certificate Registration" />
          </div>
          <div className="form-group">
            <label className="form-label">Description <span className="text-muted" style={{fontWeight:400}}>(optional)</span></label>
            <textarea className="form-control" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Brief description of the service…" />
          </div>
          <div className="form-group">
            <label className="form-label">Required Documents <span className="text-muted" style={{fontWeight:400}}>(optional)</span></label>
            <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'4px'}}>Separate multiple items with semicolons (;)</div>
            <textarea className="form-control" rows={3} value={form.required_documents}
              onChange={e => set('required_documents', e.target.value)} placeholder="e.g. Valid ID; Birth notification; Hospital records" />
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/services')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="bi bi-save"></i> {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
