import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { localDb } from '../db/localDb'
import { useAuth } from '../App'
import { useNotes } from '../hooks/useNotes'
import BottomNav from '../components/BottomNav'

export default function EditNote() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { saveNote } = useNotes(user)
  const [note, setNote]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  useEffect(() => { loadNote() }, [id])

  const loadNote = async () => {
    const notes = await localDb.getNotes(user?.id ?? null)
    const found = notes.find(n => n.id === id)
    if (!found) { setErr('Note not found.'); setLoading(false); return }
    setNote(found)
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    await saveNote(note)
    setSaving(false)
    navigate('/notes')
  }

  if (loading) return (
    <div className="loading-screen"><div className="logo">scrib<span>bly</span></div></div>
  )

  if (err || !note) return (
    <div className="page">
      <div className="topbar">
        <Link to="/notes" className="btn btn-ghost btn-sm">← back</Link>
      </div>
      <div className="empty">
        <h3>Note not found</h3>
        <Link to="/notes" className="btn btn-ghost">my notes</Link>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="page">
      <div className="topbar">
        <Link to="/notes" className="btn btn-ghost btn-sm">← cancel</Link>
        <div className="topbar-right">
          <div className="vis-group">
            <button className={`vis-opt ${note.visibility === 'public' ? 'on-pub' : ''}`}
              onClick={() => setNote({ ...note, visibility: 'public' })}>pub</button>
            <button className={`vis-opt ${note.visibility === 'private' ? 'on-priv' : ''}`}
              onClick={() => setNote({ ...note, visibility: 'private' })}>priv</button>
          </div>
          {note.visibility === 'public' && (
            <Link to={`/note/${id}`} className="btn btn-ghost btn-sm">view</Link>
          )}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? '…' : 'save'}
          </button>
        </div>
      </div>

      <div className="editor-page">
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label className="anon-label">
            <input type="checkbox" checked={!!note.is_anon}
              onChange={e => setNote({ ...note, is_anon: e.target.checked })} />
            post anonymously
          </label>
        </div>
        <input className="editor-title-input" placeholder="Note title..."
          value={note.title} onChange={e => setNote({ ...note, title: e.target.value })} />
        <textarea className="editor-body-input" placeholder="Start writing..."
          value={note.body} onChange={e => setNote({ ...note, body: e.target.value })} />
      </div>
      <BottomNav />
    </div>
  )
}
