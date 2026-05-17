import { useState, useEffect, useCallback } from 'react'
import { localDb } from '../db/localDb'
import { syncPendingNotes } from '../db/sync'
import { useNetwork } from './useNetwork'

const genId = () => Math.random().toString(36).slice(2, 10)

export function useNotes(user) {
  const [notes, setNotes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | synced | offline
  const isOnline = useNetwork()

  const displayName = () =>
    user?.user_metadata?.username || user?.email?.split('@')[0] || 'anonymous'

  const loadNotes = useCallback(async () => {
    setLoading(true)
    const data = await localDb.getNotes(user?.id ?? null)
    setNotes(data)
    setLoading(false)
  }, [user?.id])

  // Load notes on mount and when user changes
  useEffect(() => { loadNotes() }, [loadNotes])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && user) {
      setSyncStatus('syncing')
      syncPendingNotes(user.id).then(({ pushed }) => {
        setSyncStatus('synced')
        if (pushed > 0) loadNotes()
        setTimeout(() => setSyncStatus('idle'), 3000)
      })
    } else if (!isOnline) {
      setSyncStatus('offline')
    }
  }, [isOnline, user?.id])

  const saveNote = async (noteData) => {
    const isNew = !noteData.id
    const id = noteData.id || genId()
    const now = new Date().toISOString()

    const note = {
      id,
      title: noteData.title || 'Untitled',
      body: noteData.body || '',
      visibility: noteData.visibility || 'private',
      is_anon: noteData.is_anon || false,
      author: noteData.is_anon ? 'anonymous' : displayName(),
      user_id: user?.id ?? null,
      created_at: noteData.created_at || now,
      sync_status: user ? (isOnline ? 'synced' : 'pending_sync') : 'local_only',
    }

    // Save locally first (always)
    await localDb.upsertNote(note)

    // If online and logged in, also save to Supabase immediately
    if (isOnline && user) {
      const { supabase } = await import('../supabase')
      const { error } = await supabase.from('notes').upsert({
        id: note.id,
        title: note.title,
        body: note.body,
        visibility: note.visibility,
        is_anon: note.is_anon,
        author: note.author,
        user_id: user.id,
        created_at: note.created_at,
      })
      if (error) {
        // Mark as pending if remote save failed
        await localDb.upsertNote({ ...note, sync_status: 'pending_sync' })
      }
    }

    await loadNotes()
    return id
  }

  const deleteNote = async (id) => {
    await localDb.deleteNote(id)
    // Also delete from Supabase if online
    if (isOnline && user) {
      const { supabase } = await import('../supabase')
      await supabase.from('notes').delete().eq('id', id)
    }
    await loadNotes()
  }

  return { notes, loading, syncStatus, saveNote, deleteNote, reload: loadNotes }
}
