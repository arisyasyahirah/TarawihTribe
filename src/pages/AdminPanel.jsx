import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Shield, Plus, Check, X, Calendar, Users, BarChart3 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { Navigate } from 'react-router-dom'

const EMPTY_EVENT = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  category: 'prayer',
  max_capacity: 100,
  is_free: true,
}

export default function AdminPanel() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [pendingEvents, setPendingEvents] = useState([])
  const [approvedEvents, setApprovedEvents] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('events')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_EVENT)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ users: 0, bingo: 0, rsvps: 0 })

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchData()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, isAdmin])

  async function fetchData() {
    try {
      const [eventsRes, usersRes] = await Promise.allSettled([
        supabase.from('tarawihtribe_events').select('*').order('created_at', { ascending: false }),
        supabase.from('tarawihtribe_profiles').select('*').order('created_at', { ascending: false }),
      ])

      if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
        const all = eventsRes.value.data
        setPendingEvents(all.filter(e => !e.approved))
        setApprovedEvents(all.filter(e => e.approved))
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
        setUsers(usersRes.value.data)
        setStats(prev => ({ ...prev, users: usersRes.value.data.length }))
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  async function approveEvent(id) {
    await supabase.from('tarawihtribe_events').update({ approved: true }).eq('id', id)
    fetchData()
  }

  async function rejectEvent(id) {
    await supabase.from('tarawihtribe_events').delete().eq('id', id)
    fetchData()
  }

  async function createEvent() {
    if (!form.title || !form.date) return
    setSaving(true)
    try {
      await supabase.from('tarawihtribe_events').insert({
        ...form,
        approved: true,
        created_by: user.id,
        rsvp_count: 0,
        created_at: new Date().toISOString(),
      })
      setForm(EMPTY_EVENT)
      setShowForm(false)
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function promoteToAdmin(userId) {
    await supabase.from('tarawihtribe_profiles').update({ role: 'admin' }).eq('id', userId)
    fetchData()
  }

  if (authLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            Admin Panel
          </h2>
          <p className="text-slate-400 text-sm mt-1">Mosque committee controls</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 gradient-bg px-4 py-2 rounded-xl text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-xs text-slate-400">Total Users</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">{approvedEvents.length}</div>
          <div className="text-xs text-slate-400">Active Events</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <BarChart3 className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">{pendingEvents.length}</div>
          <div className="text-xs text-slate-400">Pending</div>
        </div>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-white">Create New Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Event Title *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Qiamullail Night 27"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Location</label>
              <input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Main Hall"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="prayer">Prayer</option>
                <option value="lecture">Lecture</option>
                <option value="iftar">Iftar</option>
                <option value="special">Special</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Capacity</label>
              <input
                type="number"
                value={form.max_capacity}
                onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value) })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createEvent}
              disabled={saving || !form.title || !form.date}
              className="flex-1 gradient-bg py-2.5 rounded-xl text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : 'Create Event'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 glass rounded-xl text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['events', 'pending', 'users'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              tab === t ? 'gradient-bg text-white' : 'glass text-slate-400 hover:text-white'
            }`}
          >
            {t === 'pending' ? `Pending (${pendingEvents.length})` : t}
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="space-y-3">
          {approvedEvents.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-slate-400">No approved events yet.</div>
          ) : (
            approvedEvents.map(event => (
              <div key={event.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="text-xs text-slate-400">{event.date} · {event.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Live
                  </span>
                  <button onClick={() => rejectEvent(event.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Tab */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pendingEvents.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-slate-400">No pending events.</div>
          ) : (
            pendingEvents.map(event => (
              <div key={event.id} className="glass rounded-xl p-4">
                <p className="font-medium text-white">{event.title}</p>
                <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                <p className="text-xs text-slate-500 mt-1">{event.date} · {event.location}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => approveEvent(event.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => rejectEvent(event.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">
                  {(u.display_name || u.username)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.display_name || u.username}</p>
                  <p className="text-xs text-slate-500">{u.role || 'member'}</p>
                </div>
              </div>
              {u.role !== 'admin' && (
                <button
                  onClick={() => promoteToAdmin(u.id)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Make Admin
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
