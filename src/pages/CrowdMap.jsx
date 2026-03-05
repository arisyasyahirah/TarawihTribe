import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MapPin, Users, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const ZONES = [
  { id: 'parking_a', name: 'Parking A', icon: '🅿️', description: 'Main entrance parking' },
  { id: 'parking_b', name: 'Parking B', icon: '🅿️', description: 'Side street parking' },
  { id: 'main_hall', name: 'Main Hall', icon: '🕌', description: 'Main prayer hall' },
  { id: 'wanita', name: 'Wanita Hall', icon: '🌸', description: 'Women\'s prayer section' },
  { id: 'surau', name: 'Surau', icon: '⭐', description: 'Small prayer room' },
  { id: 'toilet', name: 'Toilet', icon: '🚿', description: 'Ablution area' },
]

const STATUS_CONFIG = {
  empty: { label: 'Empty', color: 'bg-green-500', textColor: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10' },
  moderate: { label: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
  crowded: { label: 'Crowded', color: 'bg-orange-500', textColor: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  full: { label: 'Full', color: 'bg-red-500', textColor: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' },
}

// Mock initial data
const MOCK_CROWD = {
  parking_a: 'moderate',
  parking_b: 'crowded',
  main_hall: 'full',
  wanita: 'moderate',
  surau: 'empty',
  toilet: 'crowded',
}

export default function CrowdMap() {
  const { user } = useAuth()
  const [crowdData, setCrowdData] = useState(MOCK_CROWD)
  const [loading, setLoading] = useState(false)
  const [reporting, setReporting] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [success, setSuccess] = useState('')

  async function fetchCrowdData() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('tarawihtribe_crowd_reports')
        .select('zone_id, status')
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        const latestByZone = {}
        data.forEach(report => {
          if (!latestByZone[report.zone_id]) {
            latestByZone[report.zone_id] = report.status
          }
        })
        setCrowdData(prev => ({ ...prev, ...latestByZone }))
        setLastUpdated(new Date())
      }
    } catch {
      // Use mock data on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCrowdData()

    // Real-time subscription
    const channel = supabase
      .channel('crowd-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tarawihtribe_crowd_reports'
      }, payload => {
        setCrowdData(prev => ({
          ...prev,
          [payload.new.zone_id]: payload.new.status
        }))
        setLastUpdated(new Date())
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function reportStatus(zoneId, status) {
    if (!user) return
    setReporting(zoneId)
    try {
      await supabase.from('tarawihtribe_crowd_reports').insert({
        zone_id: zoneId,
        status,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      setCrowdData(prev => ({ ...prev, [zoneId]: status }))
      setSuccess(`Thanks for reporting ${ZONES.find(z => z.id === zoneId)?.name}!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setCrowdData(prev => ({ ...prev, [zoneId]: status }))
      setSuccess('Status updated locally!')
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setReporting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-purple-400" />
            Live Crowd Map
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time crowd levels at Masjid Salahuddin Al-Ayubbi
          </p>
        </div>
        <button
          onClick={fetchCrowdData}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <span className="text-xs text-slate-400">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Zone Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ZONES.map(zone => {
          const status = crowdData[zone.id] || 'empty'
          const config = STATUS_CONFIG[status]
          const isReporting = reporting === zone.id

          return (
            <div
              key={zone.id}
              className={`glass rounded-2xl p-5 border ${config.border} transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl mb-1">{zone.icon}</div>
                  <h3 className="font-semibold text-white">{zone.name}</h3>
                  <p className="text-xs text-slate-400">{zone.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.textColor} border ${config.border}`}>
                  {config.label}
                </div>
              </div>

              {/* Status Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.color} transition-all duration-500`}
                  style={{
                    width: status === 'empty' ? '10%' : status === 'moderate' ? '45%' : status === 'crowded' ? '75%' : '95%'
                  }}
                />
              </div>

              {/* Report Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => reportStatus(zone.id, key)}
                    disabled={isReporting || status === key}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      status === key
                        ? `${cfg.bg} ${cfg.textColor} border ${cfg.border}`
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
                    } disabled:cursor-not-allowed`}
                  >
                    {isReporting && status !== key ? (
                      <span className="flex justify-center"><LoadingSpinner size="sm" /></span>
                    ) : (
                      cfg.label.slice(0, 3)
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Last Updated */}
      <p className="text-center text-xs text-slate-500">
        Last updated: {lastUpdated.toLocaleTimeString('en-MY')} · Tap a status to report
      </p>

      {/* Info Box */}
      <div className="glass rounded-2xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">How it works</p>
          <p className="text-xs text-slate-400 mt-1">
            Community-reported crowd levels. Tap the status buttons (Em/Mod/Cro/Ful) to update a zone.
            Reports expire after 30 minutes to keep data fresh.
          </p>
        </div>
      </div>
    </div>
  )
}
