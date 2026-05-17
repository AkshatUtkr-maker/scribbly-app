import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { fullSync } from '../db/sync'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setErr('')
    if (!form.email || !form.password) { setErr('Please fill in all fields.'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password,
    })
    if (error) { setErr(error.message); setLoading(false); return }
    // Pull remote notes after login
    if (data.user) await fullSync(data.user.id)
    setLoading(false)
    navigate('/notes')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">scrib<span>bly</span></div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to access your notes across all devices.</p>
        {err && <div className="auth-error">{err}</div>}
        <div className="input-group">
          <label>EMAIL</label>
          <input className="input-field" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        <div className="input-group">
          <label>PASSWORD</label>
          <input className="input-field" type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handle} disabled={loading}>
          {loading ? 'signing in…' : 'sign in'}
        </button>
        <p className="auth-switch">No account? <Link to="/signup">sign up</Link></p>
      </div>
    </div>
  )
}
