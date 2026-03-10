import { useState, useEffect } from 'react'
import { Bell, Check, BellOff, Clock, Calendar, Grid3X3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'event', title: 'Reminder: Qiamullail Tonight', body: 'Qiamullail at Masjid Salahuddin starts at 2:00 AM. Don\'t miss it!', time: new Date(Date.now() - 10 * 60000), read: false, icon: '🌟' },
  { id: 2, type: 'bingo', title: 'Don\'t forget your Bingo today!', body: 'Complete today\'s challenge: Day 14 — Pray sunnah prayers', time: new Date(Date.now() - 2 * 3600000), read: false, icon: '⭐' },
  { id: 3, type: 'friend', title: 'Ahmad Razif completed Day 13', body: 'Your friend just completed their bingo challenge!', time: new Date(Date.now() - 5 * 3600000), read: true, icon: '🎉' },
  { id: 4, type: 'event', title: 'Community Iftar tomorrow', body: 'Don\'t forget you RSVPed for Community Iftar Besar tomorrow at 6:30 PM.', time: new Date(Date.now() - 8 * 3600000), read: true, icon: '🍽️' },
  { id: 5, type: 'crowd', title: 'Parking A is clearing up', body: 'Crowd level at Parking A has dropped to Moderate. Good time to head over!', time: new Date(Date.now() - 12 * 3600000), read: true, icon: '🅿️' },
]

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  async function requestPushPermission() {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }
    setRequesting(true)
    try {
      const permission = await Notification.requestPermission()
      setPushEnabled(permission === 'granted')
      if (permission === 'granted') {
        new Notification('TarawihTribe', {
          body: 'Notifications enabled! You\'ll get reminders for Terawih and your bingo challenges.',
          icon: '/vite.svg'
        })
      }
    } finally {
      setRequesting(false)
    }
  }

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const typeIcon = {
    event: <Calendar className="w-4 h-4 text-blue-400" />,
    bingo: <Grid3X3 className="w-4 h-4 text-purple-400" />,
    friend: <Bell className="w-4 h-4 text-yellow-400" />,
    crowd: <Clock className="w-4 h-4 text-green-400" />,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm gradient-bg px-2 py-0.5 rounded-full text-white">{unreadCount}</span>
            )}
          </h2>
          <p className="text-slate-400 text-sm mt-1">Stay updated with mosque activities</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {/* Push Notification Enable */}
      <div className={`glass rounded-2xl p-4 flex items-center justify-between gap-4 border ${pushEnabled ? 'border-green-500/30' : 'border-purple-500/30'}`}>
        <div className="flex items-center gap-3">
          {pushEnabled ? (
            <Bell className="w-8 h-8 text-green-400" />
          ) : (
            <BellOff className="w-8 h-8 text-slate-400" />
          )}
          <div>
            <p className="font-medium text-white">{pushEnabled ? 'Notifications Active' : 'Enable Push Notifications'}</p>
            <p className="text-xs text-slate-400">
              {pushEnabled
                ? 'You\'ll receive reminders for Terawih, bingo challenges, and events'
                : 'Get reminders for prayer times, events, and daily bingo challenges'
              }
            </p>
          </div>
        </div>
        <button
          onClick={requestPushPermission}
          disabled={pushEnabled || requesting}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            pushEnabled
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'gradient-bg text-white hover:opacity-90'
          } disabled:opacity-50`}
        >
          {pushEnabled ? <Check className="w-4 h-4" /> : requesting ? '...' : 'Enable'}
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { label: 'Daily Bingo Reminder', desc: 'Reminded at 8 PM if you haven\'t done today\'s challenge', icon: '⭐', enabled: true },
            { label: 'Event Reminders', desc: '1 hour before events you\'ve RSVPed to', icon: '📅', enabled: true },
            { label: 'Friend Activity', desc: 'When friends complete bingo or attend events', icon: '👥', enabled: false },
            { label: 'Crowd Updates', desc: 'When parking or prayer halls are clearing up', icon: '🅿️', enabled: false },
            { label: 'Prayer Times', desc: 'Reminder 15 minutes before each prayer', icon: '🕌', enabled: true },
          ].map((pref, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{pref.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{pref.label}</p>
                  <p className="text-xs text-slate-400">{pref.desc}</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${pref.enabled ? 'bg-purple-500' : 'bg-slate-700'} relative`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pref.enabled ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            onClick={() => markRead(notification.id)}
            className={`glass rounded-xl p-4 cursor-pointer transition-all border ${
              !notification.read ? 'border-purple-500/30 bg-purple-500/5' : 'border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg flex-shrink-0">
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                    {notification.title}
                  </p>
                  {!notification.read && <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{notification.body}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {typeIcon[notification.type]}
                  <span className="text-xs text-slate-500">
                    {Math.round((Date.now() - notification.time) / 60000)} min ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
