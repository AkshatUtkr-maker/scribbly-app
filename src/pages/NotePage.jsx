import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { useNetwork } from '../hooks/useNetwork'

const fmt = ts => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

export default function NotePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const isOnline = useNetwork()
  
  // Track recorded views across connection changes
  const viewedNotes = useRef(new Set())

  const [note, setNote]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [views, setViews]       = useState(0)
  const [likes, setLikes]       = useState(0)
  const [liked, setLiked]       = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [toast, setToast]       = useState('')

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (isOnline) {
      loadAll()
    } else {
      setLoading(false)
    }
  }, [id, isOnline, user?.id])

  const loadAll = async () => {
    setLoading(true)
    
    // 1. Fetch note data
    const { data, error } = await supabase.from('notes').select('*').eq('id', id).single()
    
    // Check ownership permissions before rendering structural contents
    const isOwner = user && data && data.user_id === user.id
    if (error || !data || (data.visibility !== 'public' && !isOwner)) { 
      setNotFound(true)
      setLoading(false)
      return 
    }
    
    setNote(data)

    // 2. Track view once per active mount cycle
    if (!viewedNotes.current.has(id)) {
      await supabase.from('views').insert({ note_id: id, user_id: user?.id || null })
      viewedNotes.current.add(id)
    }

    // 3. Concurrent counts and community interaction items loading
    const [vr, lr, cr] = await Promise.all([
      supabase.from('views').select('id', { count: 'exact' }).eq('note_id', id),
      supabase.from('likes').select('id', { count: 'exact' }).eq('note_id', id),
      supabase.from('comments').select('*').eq('note_id', id).order('created_at', { ascending: true }),
    ])

    setViews(vr.count ?? 0)
    setLikes(lr.count ?? 0)
    setComments(cr.data ?? [])

    const likedList = JSON.parse(localStorage.getItem('scribbly_liked') || '[]')
    setLiked(likedList.includes(id))
    setLoading(false)
  }

  const handleLike = async () => {
    const likedList = JSON.parse(localStorage.getItem('scribbly_liked') || '[]')

    if (liked) {
      localStorage.setItem('scribbly_liked', JSON.stringify(likedList.filter(n => n !== id)))
      setLiked(false)
      setLikes(l => Math.max(0, l - 1))

      if (user) {
        await supabase.from('likes').delete().eq('note_id', id).eq('user_id', user.id)
      } else {
        await supabase.from('likes').delete().eq('note_id', id).is('user_id', null)
      }
      return
    }

    likedList.push(id)
    localStorage.setItem('scribbly_liked', JSON.stringify(likedList))
    setLiked(true)
    setLikes(l => l + 1)

    await supabase.from('likes').insert({ note_id: id, user_id: user?.id || null })
  }

  const submitComment = async () => {
    if (!commentText.trim() || !user) return
    setSubmitting(true)
    
    const author = user.user_metadata?.username || user.email?.split('@')[0] || 'anonymous'
    const { data, error } = await supabase.from('comments').insert({
      note_id: id, 
      user_id: user.id, 
      author, 
      body: commentText.trim(),
    }).select().single()

    if (!error && data) { 
      setComments(c => [...c, data])
      setCommentText('') 
    } else { 
      showToast('Failed to post comment') 
    }
    setSubmitting(false)
  }

  const copyLink = () => {
    // Use your actual deployed Vercel URL here
  const url = `https://scribbly-tau.vercel.app/note/${id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('Link copied!')
  }

  if (!isOnline) return (
    <div className="page">
      <div className="note-page-topbar">
        <Link to="/feed" className="note-page-back">← feed</Link>
      </div>
      <div className="empty">
        <div className="empty-icon">📡</div>
        <h3>You're offline</h3>
        <p>Public notes need an internet connection to load.</p>
      </div>
    </div>
  )

  if (loading) return (
    <div className="loading-screen"><div className="logo">scrib<span>bly</span></div></div>
  )

  if (notFound) return (
    <div className="page">
      <div className="note-page-topbar">
        <Link to="/feed" className="note-page-back">← feed</Link>
      </div>
      <div className="empty">
        <h3>Note not found</h3>
        <p>This note doesn't exist or isn't public.</p>
        <Link to="/feed" className="btn btn-ghost" style={{ marginTop: '0.5rem' }}>back to feed</Link>
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="note-page-topbar">
        <Link to="/feed" className="note-page-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          scribbly
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={copyLink}>
            {copied ? 'copied!' : 'share'}
          </button>
          {user && note.user_id === user.id && (
            <Link to={`/edit/${note.id}`} className="btn btn-ghost btn-sm">edit</Link>
          )}
        </div>
      </div>

      <div className="note-page">
        <div className="note-title">{note.title || 'Untitled'}</div>
        <div className="note-meta">
          <span>{note.is_anon ? 'anonymous' : `@${note.author}`}</span>
          <span>·</span>
          <span>{fmt(note.created_at)}</span>
          <span className={`badge ${note.is_anon ? 'badge-anon' : 'badge-pub'}`}>
            {note.is_anon ? 'anon' : note.visibility}
          </span>
        </div>

        <div className="note-body">{note.body}</div>

        <div className="note-stats">
          <span className="stat-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {views} {views === 1 ? 'view' : 'views'}
          </span>
          <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
            {liked ? '♥' : '♡'} {likes} {likes === 1 ? 'like' : 'likes'}
          </button>
        </div>

        <div className="comments-section">
          <h3>Comments ({comments.length})</h3>
          {user ? (
            <div className="comment-form">
              <textarea 
                className="comment-textarea" 
                placeholder="Write a comment..."
                value={commentText} 
                onChange={e => setCommentText(e.target.value)} 
              />
              <button 
                className="btn btn-primary btn-sm"
                onClick={submitComment} 
                disabled={submitting || !commentText.trim()}
              >
                {submitting ? 'posting…' : 'post comment'}
              </button>
            </div>
          ) : (
            <div className="login-prompt">
              <Link to="/login">Sign in</Link> to leave a comment.
            </div>
          )}
          
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text4)', fontSize: '0.77rem', padding: '0.5rem 0' }}>
              No comments yet. Be the first.
            </p>
          ) : (
            <div className="comment-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">@{c.author}</span>
                    <span className="comment-date">{fmt(c.created_at)}</span>
                  </div>
                  <div className="comment-body">{c.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
