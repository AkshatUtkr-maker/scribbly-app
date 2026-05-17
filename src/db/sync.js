import { supabase } from '../supabase'
import { localDb } from './localDb'

// Push all pending local notes to Supabase
export async function syncPendingNotes(userId) {
  if (!userId) return { pushed: 0, errors: 0 }
  const pending = await localDb.getPendingSync(userId)
  let pushed = 0, errors = 0

  for (const note of pending) {
    const payload = {
      id: note.id,
      title: note.title,
      body: note.body,
      visibility: note.visibility,
      is_anon: note.is_anon,
      author: note.author,
      user_id: userId,
      created_at: note.created_at,
    }
    const { error } = await supabase.from('notes').upsert(payload)
    if (!error) {
      await localDb.markSynced(note.id)
      pushed++
    } else {
      errors++
    }
  }
  return { pushed, errors }
}

// Pull all notes from Supabase and merge into local DB
export async function pullRemoteNotes(userId) {
  if (!userId) return 0
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return 0

  for (const note of data) {
    await localDb.upsertNote({ ...note, sync_status: 'synced' })
  }
  return data.length
}

// Full sync: push pending first, then pull latest from server
export async function fullSync(userId) {
  if (!userId) return
  const { pushed } = await syncPendingNotes(userId)
  const pulled = await pullRemoteNotes(userId)
  return { pushed, pulled }
}
