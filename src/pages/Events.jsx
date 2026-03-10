import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Calendar, Clock, MapPin, Users, CheckCircle, Plus } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Qiamullail — Night 21',
    description: 'Special night prayer for Lailatul Qadr. Bring your family! We will recite Surah Yasin together.',
    date: '2025-03-21',
    time: '02:00',
    location: 'Main Hall',
    category: 'prayer',
    rsvp_count: 47,
    max_capacity: 200,
    is_free: true,
  },
  {
    id: 2,
    title: 'Kuliah Tafsir After Isha',
    description: 'Daily Quran tafsir session by Ustaz Ahmad. Topic: Surah Al-Baqarah continuation.',
    date: '2025-03-15',
    time: '21:30',
    location: 'Surau',
    category: 'lecture',
    rsvp_count: 23,
    max_capacity: 50,
    is_free: true,
  },
  {
    id: 3,
    title: 'Community Iftar Besar',
    description: 'Annual community iftar event. Food provided! RSVP required for catering.',
    date: '2025-03-18',
    time: '18:30',
    location: 'Mosque Compound',
    category: 'iftar',
    rsvp_count: 156,
    max_capacity: 300,
    is_free: true,
  },
  {
    id: 4,
    title: 'Terawih Champion Badge Night',
    description: 'Special certificate ceremony for jemaah who attended all 30 nights of Terawih.',
    date: '2025-03-29',
    time: '20:45',
    location: 'Main Hall',
    category: 'special',
    rsvp_count: 89,
    max_capacity: 150,
    is_free: true,
  },
  {
    id: 5,
    title: 'Kids Ramadan Art Competition',
    description: 'Creative art competition for children aged 7-12. Theme: "My Ramadan Memory"',
    date: '2025-03-16',
    time: '10:00',
    location: 'Community Hall',
    category: 'kids',
    rsvp_count: 35,
    max_capacity: 80,
    is_free: true,
  },
]

const CATEGORY_STYLES = {
  prayer: { label: 'Prayer', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  lecture: { label: 'Lecture', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  iftar: { label: 'Iftar', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  special: { label: 'Special', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  kids: { label: 'Kids', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
}

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [rsvps, setRsvps] = useState(new Set())
  const [rsvpLoading, setRsvpLoading] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchEvents()
    if (user) fetchMyRsvps()
  }, [user])

  async function fetchEvents() {
    try {
      const { data } = await supabase
        .from('tarawihtribe_events')
        .select('*')
        .eq('approved', true)
        .order('date', { ascending: true })

      if (data && data.length > 0) {
        setEvents(data)
      } else {
        setEvents(MOCK_EVENTS)
      }
    } catch {
      setEvents(MOCK_EVENTS)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyRsvps() {
    // Try localStorage first
    const rsvpKey = user ? `tarawihtribe_rsvps_${user.id}` : 'tarawihtribe_rsvps_demo'
    const localRsvps = localStorage.getItem(rsvpKey)
    if (localRsvps) {
      setRsvps(new Set(JSON.parse(localRsvps)))
    }
    
    // Then try Supabase
    try {
      const { data } = await supabase
        .from('tarawihtribe_event_rsvps')
        .select('event_id')
        .eq('user_id', user.id)

      if (data && data.length > 0) {
        const rsvpIds = data.map(r => r.event_id)
        setRsvps(new Set(rsvpIds))
        // Sync to localStorage
        localStorage.setItem(rsvpKey, JSON.stringify(rsvpIds))
      }
    } catch (e) {
      console.error('Fetch RSVPs error:', e)
    }
  }

  async function toggleRsvp(event) {
    if (!user) return
    setRsvpLoading(event.id)
    const isGoing = rsvps.has(event.id)

    // Use Supabase event if available (has UUID id), otherwise skip save
    const supabaseEvent = events.find(e => e.id && e.id.length > 10)
    const eventId = supabaseEvent ? event.id : null

    // Optimistic UI update
    setRsvps(prev => {
      const next = new Set(prev)
      if (isGoing) next.delete(event.id)
      else next.add(event.id)
      return next
    })
    setEvents(prev => prev.map(e =>
      e.id === event.id
        ? { ...e, rsvp_count: e.rsvp_count + (isGoing ? -1 : 1) }
        : e
    ))
    
    // Save to localStorage as backup
    const rsvpKey = user ? `tarawihtribe_rsvps_${user.id}` : 'tarawihtribe_rsvps_demo'
    const newRsvps = new Set(rsvps)
    if (isGoing) newRsvps.delete(event.id)
    else newRsvps.add(event.id)
    localStorage.setItem(rsvpKey, JSON.stringify([...newRsvps]))

    // Save to Supabase only if we have a real UUID event
    if (eventId) {
      try {
        if (isGoing) {
          await supabase.from('tarawihtribe_event_rsvps')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', eventId)
        } else {
          await supabase.from('tarawihtribe_event_rsvps').upsert({
            user_id: user.id,
            event_id: eventId,
          }, { onConflict: 'event_id,user_id' })
          
          // Log activity for friend feed
          await supabase.from('tarawihtribe_activities').insert({
            user_id: user.id,
            type: 'event_rsvp',
            data: { title: event.title, event_id: eventId }
          })
        }
      } catch (e) {
        console.error('RSVP error:', e)
        // Revert on error
        setRsvps(prev => {
          const next = new Set(prev)
          if (isGoing) next.add(event.id)
          else next.delete(event.id)
          return next
        })
      }
    }
    setRsvpLoading(null)
  }

  const categories = ['all', ...new Set(MOCK_EVENTS.map(e => e.category))]
  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter)

  if (loading) return (
    <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading events..." /></div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Events
          </h2>
          <p className="text-slate-400 text-sm mt-1">Mosque programs this Ramadan</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat
                ? 'gradient-bg text-white'
                : 'glass text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All Events' : CATEGORY_STYLES[cat]?.label || cat}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filtered.map(event => {
          const isGoing = rsvps.has(event.id)
          const isLoading = rsvpLoading === event.id
          const catStyle = CATEGORY_STYLES[event.category] || { label: event.category, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
          const fillPercent = Math.round((event.rsvp_count / event.max_capacity) * 100)

          return (
            <div key={event.id} className="glass rounded-2xl p-5 hover:border-purple-500/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${catStyle.color}`}>
                      {catStyle.label}
                    </span>
                    {event.is_free && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        FREE
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-lg">{event.title}</h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">{event.description}</p>

                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(event.date + 'T00:00:00'), 'dd MMM yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </span>
                  </div>

                  {/* Capacity bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.rsvp_count} going
                      </span>
                      <span>{fillPercent}% full</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full transition-all ${fillPercent > 80 ? 'bg-red-500' : fillPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* RSVP Button */}
                <button
                  onClick={() => toggleRsvp(event)}
                  disabled={isLoading}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    rsvps.has(event.id)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                      : 'gradient-bg text-white hover:opacity-90'
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : rsvps.has(event.id) ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Going
                    </span>
                  ) : (
                    "I'M GOING"
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No events in this category yet.</p>
        </div>
      )}
    </div>
  )
}
