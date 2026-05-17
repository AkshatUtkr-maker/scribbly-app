import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { useNotes } from '../hooks/useNotes'
import BottomNav from '../components/BottomNav'

export default function NewNote() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { saveNote } = useNotes(user)
  const [note, setNote]   = useState({ title: '', body: '', visibility: 'private', is_anon: false })
  const [saving, setSaving] = useState(false)
  const [err, setErr]     = useState('')

  const save = async () => {
    if (!note.title.trim() && !note.body.trim()) { setErr('Add a title or some content first.'); return }
    setSaving(true)
    const id = await saveNote(note)
    setSaving(false)
    navigate(user ? '/notes' : (note.visibility === 'public' ? `/note/${id}` : '/'))
  }

  return (
    <div className="page">
      <div className="topbar">
        <Link to={user ? '/notes' : '/'} className="btn btn-ghost btn-sm">← cancel</Link>
        <div className="topbar-right">
          <div className="vis-group">
            <button className={`vis-opt ${note.visibility === 'public' ? 'on-pub' : ''}`}
              onClick={() => setNote({ ...note, visibility: 'public' })}>pub</button>
            <button className={`vis-opt ${note.visibility === 'private' ? 'on-priv' : ''}`}
              onClick={() => setNote({ ...note, visibility: 'private' })}>priv</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? '…' : 'save'}
          </button>
        </div>
      </div>

      <div className="editor-page">
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label className="anon-label">
            <input type="checkbox" checked={note.is_anon}
              onChange={e => setNote({ ...note, is_anon: e.target.checked })} />
            post anonymously
          </label>
          {!user && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text4)', marginLeft: 'auto' }}>
              <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link> to sync
            </span>
          )}
        </div>
        {err && <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--danger)' }}>{err}</div>}
        <input className="editor-title-input" placeholder="Note title..."
          value={note.title} onChange={e => setNote({ ...note, title: e.target.value })} />
        <textarea className="editor-body-input" placeholder="Start writing..."
          value={note.body} onChange={e => setNote({ ...note, body: e.target.value })} />
      </div>
      <BottomNav />
    </div>
  )
}
