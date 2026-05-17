import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '', username: '' })
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setErr('')
    if (!form.email || !form.password || !form.username.trim()) { setErr('Please fill in all fields.'); return }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { username: form.username.trim() } },
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    navigate('/notes')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">scrib<span>bly</span></div>
        <h2>Create account</h2>
        <p className="sub">Join Scribbly — it's free.</p>
        {err && <div className="auth-error">{err}</div>}
        <div className="input-group">
          <label>USERNAME</label>
          <input className="input-field" placeholder="your_username"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        </div>
        <div className="input-group">
          <label>EMAIL</label>
          <input className="input-field" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="input-group">
          <label>PASSWORD</label>
          <input className="input-field" type="password" placeholder="min. 6 characters"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handle} disabled={loading}>
          {loading ? 'creating account…' : 'create account'}
        </button>
        <p className="auth-switch">Already have an account? <Link to="/login">sign in</Link></p>
      </div>
    </div>
  )
}
