import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
//  Paste your Supabase project URL and anon key here.
//  Find them at: https://supabase.com → your project → Settings → API
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://wtinhuogjpquskzidwzp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aW5odW9nanBxdXNremlkd3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzgyODMsImV4cCI6MjA5NDQxNDI4M30.5JCNM_yaAJMgkTe1rWCKzq0y8FWVYnK34_mZRcvWb1k'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
