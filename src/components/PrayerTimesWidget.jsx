import { useState, useEffect } from 'react'
import { Clock, Moon } from 'lucide-react'
import { getPrayerTimes, getNextPrayer, getRamadanDay } from '../utils/prayerTimes'

export default function PrayerTimesWidget() {
  const [nextPrayer, setNextPrayer] = useState(getNextPrayer())
  const [now, setNow] = useState(new Date())
  const prayerTimes = getPrayerTimes()
  const ramadanDay = getRamadanDay()

  useEffect(() => {
    const interval = setInterval(() => {
      setNextPrayer(getNextPrayer())
      setNow(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const prayers = [
    { key: 'fajr', name: 'Fajr', arabicName: 'الفجر', time: prayerTimes.fajr },
    { key: 'dhuhr', name: 'Dhuhr', arabicName: 'الظهر', time: prayerTimes.dhuhr },
    { key: 'asr', name: 'Asr', arabicName: 'العصر', time: prayerTimes.asr },
    { key: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', time: prayerTimes.maghrib },
    { key: 'isha', name: 'Isha', arabicName: 'العشاء', time: prayerTimes.isha },
    { key: 'terawih', name: 'Terawih', arabicName: 'التراويح', time: prayerTimes.terawih },
  ]

  const currentHM = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Prayer Times
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Masjid Salahuddin Al-Ayubbi, KL</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Ramadan</div>
          <div className="text-2xl font-bold gradient-text">Day {ramadanDay}</div>
        </div>
      </div>

      {/* Next Prayer Countdown */}
      <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-400 mb-1">Next Prayer</p>
        <p className="text-lg font-bold text-white">{nextPrayer.name} — {nextPrayer.time}</p>
        <p className="text-purple-400 text-sm mt-1">
          in {nextPrayer.hoursUntil > 0 ? `${nextPrayer.hoursUntil}h ` : ''}{nextPrayer.minsUntil}m
        </p>
      </div>

      {/* Prayer List */}
      <div className="space-y-1">
        {prayers.map(prayer => {
          const [h, m] = prayer.time.split(':').map(Number)
          const prayerMin = h * 60 + m
          const isPast = currentHM > prayerMin
          const isNext = nextPrayer.name === prayer.name

          return (
            <div
              key={prayer.key}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                isNext
                  ? 'bg-purple-500/20 border border-purple-500/30'
                  : isPast
                  ? 'opacity-40'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {isNext && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />}
                {!isNext && <div className="w-2 h-2 rounded-full bg-slate-700" />}
                <span className="text-sm font-medium text-white">{prayer.name}</span>
                <span className="text-xs text-slate-500">{prayer.arabicName}</span>
              </div>
              <span className={`text-sm font-mono ${isNext ? 'text-purple-400 font-bold' : isPast ? 'text-slate-500' : 'text-slate-300'}`}>
                {prayer.time}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
