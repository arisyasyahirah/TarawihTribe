import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Users, Heart, Zap, Clock } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'

const MOCK_ACTIVITIES = [
  { id: 1, user: 'Ahmad Razif', action: 'completed bingo day', detail: 'Day 14: Pray sunnah prayers', icon: '⭐', time: new Date(Date.now() - 5 * 60000), color: 'text-yellow-400' },
  { id: 2, user: 'Nur Hidayah', action: 'marked attendance for', detail: 'Qiamullail Night', icon: '🌟', time: new Date(Date.now() - 12 * 60000), color: 'text-purple-400' },
  { id: 3, user: 'Hafiz Rahman', action: 'completed bingo day', detail: 'Day 13: Bring water for wudhu', icon: '💧', time: new Date(Date.now() - 25 * 60000), color: 'text-green-400' },
  { id: 4, user: 'Fatimah Zahra', action: 'RSVPed to', detail: 'Kuliah After Isha', icon: '📖', time: new Date(Date.now() - 45 * 60000), color: 'text-blue-400' },
  { id: 5, user: 'Amirul Fikri', action: 'completed bingo day', detail: 'Day 12: Give salam to 10 people', icon: '👋', time: new Date(Date.now() - 60 * 60000), color: 'text-orange-400' },
  { id: 6, user: 'Siti Aisyah', action: 'reported crowd at', detail: 'Main Hall — Full', icon: '🕌', time: new Date(Date.now() - 90 * 60000), color: 'text-red-400' },
]

export default function FriendFeed() {
  const { user } = useAuth()
  const [activities, setActivities] = useState(MOCK_ACTIVITIES)
  const [loading, setLoading] = useState(true)
  const [cheering, setCheering] = useState({})
  const [cheers, setCheers] = useState({})

  useEffect(() => {
    fetchActivities()

    // Real-time subscription
    const channel = supabase
      .channel('activities-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tarawihtribe_activities'
      }, payload => {
        fetchActivities()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchActivities() {
    // Load from localStorage first
    const localKey = 'tarawihtribe_activities_local'
    const localData = localStorage.getItem(localKey)
    if (localData) {
      const localActivities = JSON.parse(localData)
      const mapped = localActivities.map(a => ({
        id: a.id,
        user: 'You',
        action: a.type === 'bingo_complete' ? 'completed bingo day' : a.type === 'event_rsvp' ? 'RSVPed to' : 'updated',
        detail: a.data?.title || '',
        icon: a.type === 'bingo_complete' ? '⭐' : a.type === 'event_rsvp' ? '📌' : '📌',
        time: new Date(a.created_at),
        color: 'text-purple-400',
      }))
      setActivities(mapped)
    }
    
    // Then try Supabase
    const { data, error } = await supabase
      .from('tarawihtribe_activities')
      .select(`
        *,
        tarawihtribe_profiles(display_name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data && data.length > 0) {
      const mapped = data.map(a => ({
        id: a.id,
        user: a.tarawihtribe_profiles?.display_name || 'Anonymous',
        action: a.type === 'bingo_complete' ? 'completed bingo day' : a.type === 'event_rsvp' ? 'RSVPed to' : 'updated',
        detail: a.data?.title || '',
        icon: a.type === 'bingo_complete' ? '⭐' : a.type === 'event_rsvp' ? '📌' : '📌',
        time: new Date(a.created_at),
        color: 'text-purple-400',
      }))
      setActivities(prev => {
        // Merge local and Supabase, dedupe by id
        const combined = [...mapped, ...prev.filter(p => !mapped.find(m => m.id === p.id))]
        return combined.slice(0, 50)
      })
    }
    
    if (error) {
      console.error('Activities fetch error:', error)
    }
    
    setLoading(false)
  }

  function handleCheer(id) {
    setCheering(prev => ({ ...prev, [id]: true }))
    setCheers(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
    setTimeout(() => setCheering(prev => ({ ...prev, [id]: false })), 600)
  }

  if (loading && activities.length === 0) return (
    <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading feed..." /></div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Friend Feed
        </h2>
        <p className="text-slate-400 text-sm mt-1">Real-time community activity</p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs text-green-400 font-medium">LIVE</span>
        <span className="text-xs text-slate-500">· {activities.length} activities today</span>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="glass rounded-2xl p-4 flex items-start gap-4 hover:border-purple-500/20 transition-colors">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {activity.user[0]?.toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                <span className="font-semibold">{activity.user}</span>
                <span className="text-slate-400"> {activity.action} </span>
                <span className={`font-medium ${activity.color}`}>{activity.detail}</span>
                {' '}<span className="text-lg">{activity.icon}</span>
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(activity.time, { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Cheer button */}
            <button
              onClick={() => handleCheer(activity.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all ${
                cheers[activity.id]
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 scale-95'
                  : 'bg-slate-800/50 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 border border-slate-700'
              }`}
            >
              <Zap className={`w-3 h-3 ${cheering[activity.id] ? 'animate-bounce' : ''}`} />
              {cheers[activity.id] ? `+${cheers[activity.id]}` : 'Cheer'}
            </button>
          </div>
        ))}
      </div>

      {activities.length === 0 && !loading && (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No activity yet. Be the first to complete a bingo challenge!</p>
        </div>
      )}
    </div>
  )
}
