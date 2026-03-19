import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const EMPTY = { title:'', description:'', achieved_on:'', is_active: true }

export default function AchievementForm() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) api.get('/achievements').then(r => {
      const a = r.data.find(x => x.id === parseInt(id))
      if (a) setForm({ title: a.title, description: a.description || '', achieved_on: a.achieved_on || '', is_active: a.is_active })
    })
  }, [id])

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (isEdit) await api.put(`/achievements/${id}`, form)
      else        await api.post('/achievements', form)
      navigate('/admin/achievements')
    } catch (err) { setError(err.response?.data?.error || 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>{isEdit ? 'Edit' : 'New'} Achievement</h1><p>Fill in the achievement details</p></div>
        <button className="btn btn-outline" onClick={() => navigate('/admin/achievements')}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
      </div>
      <div className="card p-4" style={{maxWidth:'680px'}}>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-control" value={form.title} required
              onChange={e => set('title', e.target.value)} placeholder="Achievement title…" />
          </div>
          <div className="form-group">
            <label className="form-label">Description <span className="text-muted" style={{fontWeight:400}}>(optional)</span></label>
            <textarea className="form-control" rows={4} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Describe this achievement…" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div className="form-group">
              <label className="form-label">Date Achieved <span className="text-muted" style={{fontWeight:400}}>(optional)</span></label>
              <input type="date" className="form-control" value={form.achieved_on}
                onChange={e => set('achieved_on', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.is_active ? '1' : '0'} onChange={e => set('is_active', e.target.value === '1')}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/achievements')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="bi bi-save"></i> {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
