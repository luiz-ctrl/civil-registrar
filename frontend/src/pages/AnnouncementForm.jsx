import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || ''

export default function AnnouncementForm() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const [form, setForm] = useState({ title:'', content:'', is_active:'1' })
  const [current, setCurrent]   = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) api.get(`/announcements/${id}`).then(r => {
      const a = r.data
      setCurrent(a)
      setForm({ title: a.title, content: a.content, is_active: a.is_active ? '1' : '0' })
    })
  }, [id])

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      fd.append('is_active', form.is_active)
      if (imageFile) fd.append('image', imageFile)
      if (isEdit) await api.put(`/announcements/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      else        await api.post('/announcements', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/admin/announcements')
    } catch (err) { setError(err.response?.data?.error || 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>{isEdit ? 'Edit' : 'New'} Announcement</h1><p>Fill in the announcement details</p></div>
        <button className="btn btn-outline" onClick={() => navigate('/admin/announcements')}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
      </div>
      <div className="card p-4" style={{maxWidth:'720px'}}>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-control" value={form.title} required
              onChange={e => set('title', e.target.value)} placeholder="Announcement title…" />
          </div>
          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea className="form-control" rows={5} value={form.content} required
              onChange={e => set('content', e.target.value)} placeholder="Write announcement content…" />
          </div>
          <div className="form-group">
            <label className="form-label">Photo <span className="text-muted" style={{fontWeight:400}}>(optional)</span></label>
            {current?.image && (
              <div style={{marginBottom:'8px'}}>
                <img src={`${API_BASE}/uploads/announcements/${current.image}`}
                  style={{maxHeight:'140px',borderRadius:'8px',border:'1px solid var(--border)'}} alt="Current" />
                <div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'4px'}}>Current photo — upload a new one to replace it.</div>
              </div>
            )}
            <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.webp"
              onChange={e => setImageFile(e.target.files[0])} />
            <div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'4px'}}>Accepted: JPG, PNG, WEBP</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.is_active} onChange={e => set('is_active', e.target.value)}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/announcements')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="bi bi-save"></i> {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
