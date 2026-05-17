import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { useNotes } from '../hooks/useNotes'
import { useNetwork } from '../hooks/useNetwork'
import { supabase } from '../supabase'
import BottomNav from '../components/BottomNav'

const fmt = ts => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

export default function MyNotes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notes, loading, syncStatus, deleteNote } = useNotes(user)
  const isOnline = useNetwork()
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleDelete = async (id) => {
    await deleteNote(id)
    setConfirmDelete(null)
    showToast('Note deleted')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const syncLabel = {
    syncing: { label: 'syncing…', cls: 'sync-syncing' },
    synced:  { label: 'synced ✓', cls: 'sync-synced'  },
    offline: { label: 'offline',  cls: 'sync-offline'  },
  }[syncStatus]

  return (
    <div className="page">
      <div className="topbar">
        <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--text)' }}>
          {user ? `@${user.user_metadata?.username || user.email?.split('@')[0]}` : 'My Notes'}
        </span>
        <div className="topbar-right">
          {syncLabel && <span className={`sync-badge ${syncLabel.cls}`}>{syncLabel.label}</span>}
          {user ? (
            <button className="btn btn-ghost btn-sm" onClick={signOut}>sign out</button>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">sign in</Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="empty"><p style={{ color: '#333' }}>loading...</p></div>
      ) : notes.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✍️</div>
          <h3>No notes yet</h3>
          <p>{user ? 'Hit + to create your first note.' : 'Sign in to sync notes across devices, or just start writing.'}</p>
          <Link to="/new" className="btn btn-primary">new note</Link>
        </div>
      ) : (
        <div className="notes-list">
          {notes.map(note => (
            <div key={note.id} className="note-row" onClick={() => navigate(`/edit/${note.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="note-row-title">{note.title || 'Untitled'}</div>
                  {note.body ? <div className="note-row-preview">{note.body}</div> : null}
                  <div className="note-row-meta">
                    <span className={`badge ${note.visibility === 'public' ? 'badge-pub' : 'badge-priv'}`}>
                      {note.visibility}
                    </span>
                    {note.sync_status === 'pending_sync' && (
                      <span className="sync-badge sync-syncing" style={{ fontSize: '0.58rem' }}>pending</span>
                    )}
                    <span>{fmt(note.created_at)}</span>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  style={{ marginLeft: '0.75rem', flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); setConfirmDelete(note.id) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm sheet */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3>Delete note?</h3>
            <p>This can't be undone. The note will be removed from this device{user && isOnline ? ' and Supabase' : ''}.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      <BottomNav />
    </div>
  )
}
