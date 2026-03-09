import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, Moon, Star, Zap } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

export default function AuthForm() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp, signInWithGoogle, enterDemoMode } = useAuth()

  function getErrorMessage(err) {
    const msg = err?.message || String(err)
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
      return 'Cannot connect to server. Check your internet connection, or use Demo Mode below.'
    }
    if (msg.includes('Invalid login credentials')) {
      return 'Wrong email or password. Please try again.'
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link first.'
    }
    if (msg.includes('User already registered')) {
      return 'This email is already registered. Try signing in instead.'
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters.'
    }
    return msg
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your display name')
        }
        const { data, error } = await signUp(email, password, displayName)
        if (error) throw error
        // If user is returned and confirmed, they're logged in
        if (data?.user && !data?.user?.email_confirmed_at && data?.session === null) {
          setSuccess('✅ Account created! Check your email to confirm, then sign in.')
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(getErrorMessage(error))
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Moon className="w-8 h-8 text-purple-400" />
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">TarawihTribe</h1>
          <p className="text-slate-400 text-sm mt-1">Masjid Salahuddin Al-Ayubbi</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {/* Tab Toggle */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'login'
                  ? 'gradient-bg text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signup'
                  ? 'gradient-bg text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-500">
              <span className="bg-transparent px-3">or</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            className="w-full bg-slate-800/50 border border-slate-700 hover:border-slate-600 py-3 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3 mb-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Demo Mode */}
          <button
            onClick={enterDemoMode}
            className="w-full bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500/50 py-3 rounded-xl text-yellow-400 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Try Demo Mode (No Account Needed)
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            Demo mode lets you explore all features without signing up
          </p>
        </div>

        {/* Setup hint */}
        <div className="mt-4 glass rounded-xl p-4 text-xs text-slate-400">
          <p className="font-medium text-slate-300 mb-1">⚙️ Setup Required</p>
          <p>To use real accounts: run <code className="text-purple-400">supabase_schema.sql</code> in your Supabase SQL Editor, then update <code className="text-purple-400">.env.local</code> with your project credentials.</p>
        </div>
      </div>
    </div>
  )
}
