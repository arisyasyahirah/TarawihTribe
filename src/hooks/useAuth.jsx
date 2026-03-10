import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@tarawihtribe.com',
}
const DEMO_PROFILE = {
  id: 'demo-user-001',
  username: 'demo',
  display_name: 'Demo Jemaah',
  role: 'admin',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER)
  const [profile, setProfile] = useState(DEMO_PROFILE)
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(true)

  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    return url && key && !url.includes('placeholder') && !key.includes('placeholder')
  }

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setDemoMode(false)
      setUser(null)
      setProfile(null)
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else setLoading(false)
      }).catch(() => {
        setUser(DEMO_USER)
        setProfile(DEMO_PROFILE)
        setDemoMode(true)
        setLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('tarawihtribe_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch {
      setProfile({ id: userId, display_name: 'User', role: 'member' })
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email, password, displayName) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Please configure Supabase to use sign up. Or use Demo Mode!' } }
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin }
      })
      if (error) return { data, error }
      if (data.user) {
        await supabase.from('tarawihtribe_profiles').upsert({
          id: data.user.id,
          username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
          display_name: displayName,
          role: 'member',
        }).catch(() => {})
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message || 'Network error' } }
    }
  }

  async function signIn(email, password) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Please configure Supabase to sign in. Use Demo Mode instead!' } }
    }
    try {
      return await supabase.auth.signInWithPassword({ email, password })
    } catch (err) {
      return { data: null, error: { message: err.message || 'Network error' } }
    }
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Please configure Supabase for Google login. Use Demo Mode!' } }
    }
    try {
      return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
    } catch (err) {
      return { data: null, error: { message: err.message || 'Google login failed' } }
    }
  }

  function enterDemoMode() {
    localStorage.setItem('tt_demo_mode', 'true')
    setUser(DEMO_USER)
    setProfile(DEMO_PROFILE)
    setDemoMode(true)
  }

  async function signOut() {
    if (user) {
      return supabase.auth.signOut()
    }
  }

  async function updateProfile(updates) {
    if (demoMode) {
      setProfile(prev => ({ ...prev, ...updates }))
      return { data: { ...profile, ...updates }, error: null }
    }
    if (!user) return
    const { data, error } = await supabase
      .from('tarawihtribe_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
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
