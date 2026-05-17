import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabase'
import { fullSync } from './db/sync'
import { useNetwork } from './hooks/useNetwork'

import Home     from './pages/Home'
import Login    from './pages/Login'
import Signup   from './pages/Signup'
import Feed     from './pages/Feed'
import MyNotes  from './pages/MyNotes'
import NotePage from './pages/NotePage'
import NewNote  from './pages/NewNote'
import EditNote from './pages/EditNote'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const isOnline = useNetwork()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      const u = sess?.user ?? null
      setUser(u)
      // Full sync when user logs in
      if (u && isOnline) fullSync(u.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="loading-screen">
      <div className="logo">scrib<span>bly</span></div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user }}>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/signup"   element={<Signup />} />
        <Route path="/feed"     element={<Feed />} />
        <Route path="/notes"    element={<MyNotes />} />
        <Route path="/note/:id" element={<NotePage />} />
        <Route path="/new"      element={<NewNote />} />
        <Route path="/edit/:id" element={<EditNote />} />
      </Routes>
    </AuthContext.Provider>
  )
}
