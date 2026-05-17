import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { useNetwork } from '../hooks/useNetwork'
import BottomNav from '../components/BottomNav'

const fmt = ts => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

export default function Feed() {
  const { user } = useAuth()
  const isOnline = useNetwork()
  const navigate = useNavigate()
  const [notes, setNotes]   = useState([])
  const [stats, setStats]   = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOnline) loadNotes()
    else setLoading(false)
  }, [isOnline])

  const loadNotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notes').select('*').eq('visibility', 'public')
      .order('created_at', { ascending: false })
    if (data) {
      setNotes(data)
      loadStats(data.map(n => n.id))
    }
    setLoading(false)
  }

  const loadStats = async (ids) => {
    if (!ids.length) return
    const [lr, vr] = await Promise.all([
      supabase.from('likes').select('note_id').in('note_id', ids),
      supabase.from('views').select('note_id').in('note_id', ids),
    ])
    const s = {}
    ids.forEach(id => { s[id] = { likes: 0, views: 0 } })
    lr.data?.forEach(r => { if (s[r.note_id]) s[r.note_id].likes++ })
    vr.data?.forEach(r => { if (s[r.note_id]) s[r.note_id].views++ })
    setStats(s)
  }

  return (
    <div className="page">
      <div className="topbar">
        <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--text)' }}>Public Feed</span>
        <div className="topbar-right">
          {!isOnline && <span className="sync-badge sync-offline">offline</span>}
        </div>
      </div>

      <div className="feed-content">
        {!isOnline ? (
          <div className="empty">
            <div className="empty-icon">📡</div>
            <h3>You're offline</h3>
            <p>Public feed needs an internet connection. Your own notes are still available.</p>
          </div>
        ) : loading ? (
          <div className="empty"><p style={{ color: '#333' }}>loading...</p></div>
        ) : notes.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <h3>Nothing here yet</h3>
            <p>Be the first to share a note publicly.</p>
            <Link to="/new" className="btn btn-primary">write something</Link>
          </div>
        ) : (
          <>
            <div className="feed-hd">
              <h2>Public Notes</h2>
              <p>{notes.length} notes shared with the world</p>
            </div>
            <div className="cards">
              {notes.map(note => (
                <Link key={note.id} to={`/note/${note.id}`} className="card">
                  <div className="card-title">{note.title || 'Untitled'}</div>
                  <div className="card-preview">{note.body}</div>
                  <div className="card-foot">
                    <span>{note.is_anon ? 'anonymous' : `@${note.author}`} · {fmt(note.created_at)}</span>
                    <div className="card-stats">
                      <span>👁 {stats[note.id]?.views ?? 0}</span>
                      <span>♥ {stats[note.id]?.likes ?? 0}</span>
                      <span className={`badge ${note.is_anon ? 'badge-anon' : 'badge-pub'}`}>
                        {note.is_anon ? 'anon' : 'public'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
