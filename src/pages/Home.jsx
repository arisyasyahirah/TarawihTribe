import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PrayerTimesWidget from '../components/PrayerTimesWidget'
import { MapPin, Grid3X3, Users, Calendar, Moon, Star, Zap } from 'lucide-react'

const QUICK_STATS = [
  { icon: '🕌', label: 'Main Hall', status: 'Full', color: 'text-red-400' },
  { icon: '🅿️', label: 'Parking A', status: 'Moderate', color: 'text-yellow-400' },
  { icon: '🌟', label: 'Next Event', status: 'Tonight 8 PM', color: 'text-blue-400' },
]

const FEATURE_CARDS = [
  { path: '/crowd', icon: MapPin, label: 'Crowd Map', desc: 'See live parking & hall status', gradient: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/20', iconColor: 'text-red-400' },
  { path: '/bingo', icon: Grid3X3, label: 'Bingo Grid', desc: 'Track your 30-day journey', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
  { path: '/feed', icon: Users, label: 'Friend Feed', desc: 'See community activities', gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
  { path: '/events', icon: Calendar, label: 'Events', desc: 'Mosque programs & RSVP', gradient: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/20', iconColor: 'text-green-400' },
]

export default function Home() {
  const { profile, user } = useAuth()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Selamat Malam'

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-400 font-medium">Ramadan Kareem 🌙</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {profile?.display_name || user?.email?.split('@')[0] || 'Jemaah'}! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome to TarawihTribe — your Ramadan companion for Masjid Salahuddin Al-Ayubbi
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Live community data active</span>
          </div>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_STATS.map((stat, i) => (
          <div key={i} className="glass rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className={`text-xs font-semibold ${stat.color}`}>{stat.status}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURE_CARDS.map(card => (
          <Link
            key={card.path}
            to={card.path}
            className={`glass rounded-2xl p-5 bg-gradient-to-br ${card.gradient} border ${card.border} hover:scale-[1.02] transition-transform`}
          >
            <card.icon className={`w-7 h-7 ${card.iconColor} mb-3`} />
            <h3 className="font-bold text-white text-sm">{card.label}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Prayer Times */}
      <PrayerTimesWidget />

      {/* Community Challenge Banner */}
      <div className="glass rounded-2xl p-5 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <div className="flex items-center gap-3 mb-3">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <h3 className="font-bold text-white">14-Day Community Challenge</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Join the TarawihTribe community challenge! Complete your bingo grid and compete with friends during Ramadan.
        </p>
        <div className="flex gap-3">
          <Link
            to="/bingo"
            className="flex-1 gradient-bg rounded-xl py-2.5 text-center text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Start Challenge
          </Link>
          <Link
            to="/feed"
            className="glass rounded-xl py-2.5 px-4 text-center text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            See Leaders
          </Link>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-4" />
    </div>
  )
}
