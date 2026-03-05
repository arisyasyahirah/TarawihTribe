import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User, Grid3X3, Calendar, Edit3, CheckCircle, Trophy } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { user, profile, updateProfile } = useAuth()
  const [bingoCount, setBingoCount] = useState(0)
  const [rsvpCount, setRsvpCount] = useState(0)
  const [recentRsvps, setRecentRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchStats()
      setDisplayName(profile?.display_name || '')
    }
  }, [user, profile])

  async function fetchStats() {
    try {
      const [bingoRes, rsvpRes] = await Promise.allSettled([
        supabase.from('tarawihtribe_bingo_progress').select('day_number', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('tarawihtribe_event_rsvps').select('event_id, tarawihtribe_events(title, date)').eq('user_id', user.id).limit(5),
      ])

      if (bingoRes.status === 'fulfilled' && bingoRes.value.count !== null) {
        setBingoCount(bingoRes.value.count)
      }
      if (rsvpRes.status === 'fulfilled' && rsvpRes.value.data) {
        setRsvpCount(rsvpRes.value.data.length)
        setRecentRsvps(rsvpRes.value.data)
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    await updateProfile({ display_name: displayName })
    setSaving(false)
    setEditing(false)
  }

  const percentage = Math.round((bingoCount / 30) * 100)

  if (loading) return (
    <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading dashboard..." /></div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-2xl">
              {(profile?.display_name || user?.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="gradient-bg px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className="text-slate-400 text-sm">Cancel</button>
                </div>
              ) : (
                <h2 className="text-xl font-bold text-white">{profile?.display_name || 'User'}</h2>
              )}
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <p className="text-xs text-slate-500 mt-0.5">Member since Ramadan 2025</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-slate-400 hover:text-purple-400 transition-colors"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 text-center">
          <Grid3X3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-3xl font-bold gradient-text">{bingoCount}/30</div>
          <div className="text-xs text-slate-400 mt-1">Bingo Days Done</div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5">
            <div className="h-full rounded-full gradient-bg transition-all" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 text-center">
          <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-3xl font-bold text-blue-400">{rsvpCount}</div>
          <div className="text-xs text-slate-400 mt-1">Events RSVPed</div>
        </div>
      </div>

      {/* Achievement */}
      {bingoCount >= 7 && (
        <div className="glass rounded-2xl p-4 flex items-center gap-4 border border-yellow-500/30">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <div>
            <p className="font-semibold text-yellow-400">
              {bingoCount >= 30 ? '🏆 Ramadan Champion!' : bingoCount >= 21 ? '⭐ Almost There!' : bingoCount >= 14 ? '🌟 2 Weeks Strong!' : '✨ Week 1 Complete!'}
            </p>
            <p className="text-xs text-slate-400">
              {bingoCount >= 30 ? 'You completed all 30 days!' : `${30 - bingoCount} more days to complete the challenge`}
            </p>
          </div>
        </div>
      )}

      {/* RSVPs */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          My RSVPs
        </h3>
        {recentRsvps.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No RSVPs yet. Check out the Events page!</p>
        ) : (
          <div className="space-y-2">
            {recentRsvps.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm text-white">{r.tarawihtribe_events?.title || 'Event'}</span>
                <span className="text-xs text-slate-500 ml-auto">{r.tarawihtribe_events?.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" />
          Account
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-sm text-slate-400">Username</span>
            <span className="text-sm text-white">@{profile?.username || 'user'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-sm text-slate-400">Role</span>
            <span className="text-sm text-white capitalize">{profile?.role || 'Member'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-400">Joined</span>
            <span className="text-sm text-white">Ramadan 2025</span>
          </div>
        </div>
      </div>
    </div>
  )
}
