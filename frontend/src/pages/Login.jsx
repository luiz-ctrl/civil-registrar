import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [form, setForm]   = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/admin/dashboard')
    } catch {
      setError('Invalid username or password.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">CR</div>
          <h1>Admin Portal</h1>
          <p>Municipal Civil Registrar Office</p>
        </div>

        {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle"></i>{error}</div>}

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrap">
              <i className="bi bi-person input-icon"></i>
              <input className="form-control" style={{paddingLeft:'36px'}}
                value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))}
                placeholder="Enter username" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <i className="bi bi-lock input-icon"></i>
              <input className="form-control" type="password" style={{paddingLeft:'36px'}}
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder="Enter password" required />
            </div>
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'11px'}} disabled={loading}>
            {loading ? 'Signing in…' : <><i className="bi bi-box-arrow-in-right"></i>Sign In</>}
          </button>
        </form>
        <div style={{textAlign:'center',marginTop:'16px'}}>
          <a href="/" style={{color:'var(--primary)',fontSize:'13px'}}>
            <i className="bi bi-arrow-left me-1"></i>Back to public site
          </a>
        </div>
      </div>
    </div>
  )
}
