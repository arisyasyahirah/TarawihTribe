import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_USER = { id: 'demo-user-001', email: 'demo@tarawihtribe.com' }
const DEMO_PROFILE = { id: 'demo-user-001', username: 'demo', display_name: 'Demo Jemaah', role: 'admin' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    return url && key && url.includes('supabase') && !url.includes('placeholder')
  }

  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured()) {
        // Try real Supabase auth
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            setUser(session.user)
            await fetchProfile(session.user.id)
          }
        } catch (e) {
          console.log('Supabase unavailable, using demo mode')
        }
      }
      setLoading(false)
    }
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase.from('tarawihtribe_profiles').select('*').eq('id', userId).single()
      setProfile(data)
    } catch {
      setProfile({ id: userId, display_name: 'User', role: 'member' })
    }
  }

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    if (!error && data.user) {
      await supabase.from('tarawihtribe_profiles').upsert({
        id: data.user.id,
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        display_name: displayName,
        role: 'member',
      })
    }
    return { data, error }
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  function enterDemoMode() {
    localStorage.setItem('tt_demo_mode', 'true')
    setUser(DEMO_USER)
    setProfile(DEMO_PROFILE)
    setDemoMode(true)
  }

  async function signOut() {
    if (demoMode) {
      setUser(null)
      setProfile(null)
      setDemoMode(false)
      return
    }
    return supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    if (demoMode) {
      setProfile(prev => ({ ...prev, ...updates }))
      return { data: profile, error: null }
    }
    if (!user) return
    const { data, error } = await supabase.from('tarawihtribe_profiles').update(updates).eq('id', user.id).select().single()
    if (!error) setProfile(data)
    return { data, error }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin, demoMode,
      signUp, signIn, signInWithGoogle, signOut, updateProfile, enterDemoMode
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
