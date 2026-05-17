// ─── Local SQLite database ────────────────────────────────────
// Falls back to localStorage on web (when running in browser/Vercel)

const IS_NATIVE = !!(window.Capacitor?.isNativePlatform?.())

// ── WEB FALLBACK (localStorage) ──────────────────────────────
class WebStorage {
  _get(key, def) {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? def } catch { return def }
  }
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

  async init() {}

  async getNotes(userId) {
    const notes = this._get('scribbly_notes', [])
    if (!userId) return notes.filter(n => !n.user_id)
    return notes.filter(n => n.user_id === userId || !n.user_id)
  }

  async upsertNote(note) {
    const notes = this._get('scribbly_notes', [])
    const idx = notes.findIndex(n => n.id === note.id)
    const record = { ...note, updated_at: new Date().toISOString() }
    if (idx >= 0) notes[idx] = record
    else notes.unshift(record)
    this._set('scribbly_notes', notes)
    return record
  }

  async deleteNote(id) {
    const notes = this._get('scribbly_notes', [])
    this._set('scribbly_notes', notes.filter(n => n.id !== id))
  }

  async getPendingSync(userId) {
    const notes = this._get('scribbly_notes', [])
    return notes.filter(n => n.sync_status === 'pending_sync' && n.user_id === userId)
  }

  async markSynced(id) {
    const notes = this._get('scribbly_notes', [])
    const idx = notes.findIndex(n => n.id === id)
    if (idx >= 0) notes[idx].sync_status = 'synced'
    this._set('scribbly_notes', notes)
  }

  async clearUserNotes(userId) {
    const notes = this._get('scribbly_notes', [])
    this._set('scribbly_notes', notes.filter(n => n.user_id !== userId))
  }
}

// ── NATIVE SQLite ─────────────────────────────────────────────
class NativeStorage {
  constructor() { this.db = null }

  async init() {
    const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
    const sqlite = new SQLiteConnection(CapacitorSQLite)
    this.db = await sqlite.createConnection('scribbly', false, 'no-encryption', 1, false)
    await this.db.open()
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT DEFAULT '',
        body TEXT DEFAULT '',
        visibility TEXT DEFAULT 'private',
        is_anon INTEGER DEFAULT 0,
        author TEXT DEFAULT 'anonymous',
        user_id TEXT,
        created_at TEXT,
        updated_at TEXT,
        sync_status TEXT DEFAULT 'local_only'
      );
    `)
  }

  async getNotes(userId) {
    if (!this.db) return []
    const q = userId
      ? `SELECT * FROM notes WHERE user_id = '${userId}' OR user_id IS NULL ORDER BY updated_at DESC`
      : `SELECT * FROM notes WHERE user_id IS NULL ORDER BY updated_at DESC`
    const res = await this.db.query(q)
    return (res.values ?? []).map(n => ({ ...n, is_anon: !!n.is_anon }))
  }

  async upsertNote(note) {
    if (!this.db) return note
    const now = new Date().toISOString()
    const record = {
      id: note.id,
      title: note.title ?? '',
      body: note.body ?? '',
      visibility: note.visibility ?? 'private',
      is_anon: note.is_anon ? 1 : 0,
      author: note.author ?? 'anonymous',
      user_id: note.user_id ?? null,
      created_at: note.created_at ?? now,
      updated_at: now,
      sync_status: note.sync_status ?? 'pending_sync',
    }
    await this.db.run(
      `INSERT OR REPLACE INTO notes (id,title,body,visibility,is_anon,author,user_id,created_at,updated_at,sync_status)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [record.id, record.title, record.body, record.visibility, record.is_anon,
       record.author, record.user_id, record.created_at, record.updated_at, record.sync_status]
    )
    return { ...record, is_anon: !!record.is_anon }
  }

  async deleteNote(id) {
    if (!this.db) return
    await this.db.run(`DELETE FROM notes WHERE id = ?`, [id])
  }

  async getPendingSync(userId) {
    if (!this.db) return []
    const res = await this.db.query(
      `SELECT * FROM notes WHERE sync_status = 'pending_sync' AND user_id = ?`, [userId]
    )
    return (res.values ?? []).map(n => ({ ...n, is_anon: !!n.is_anon }))
  }

  async markSynced(id) {
    if (!this.db) return
    await this.db.run(`UPDATE notes SET sync_status = 'synced' WHERE id = ?`, [id])
  }

  async clearUserNotes(userId) {
    if (!this.db) return
    await this.db.run(`DELETE FROM notes WHERE user_id = ?`, [userId])
  }
}

// ── Export singleton ──────────────────────────────────────────
export const localDb = IS_NATIVE ? new NativeStorage() : new WebStorage()
