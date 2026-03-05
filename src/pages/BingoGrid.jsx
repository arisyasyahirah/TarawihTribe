import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, Star, Grid3X3, Share2 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const BINGO_CHALLENGES = [
  { day: 1, title: 'Terawih Night 1', desc: 'Attend first Terawih prayer', icon: '🕌' },
  { day: 2, title: 'Read Quran', desc: 'Read at least 1 page of Quran', icon: '📖' },
  { day: 3, title: 'Give Sadaqah', desc: 'Give charity, any amount', icon: '💝' },
  { day: 4, title: 'Fast Complete', desc: 'Complete a full day of fasting', icon: '🌙' },
  { day: 5, title: 'Make Dua', desc: 'Spend 10 mins in supplication', icon: '🤲' },
  { day: 6, title: 'Iftar Together', desc: 'Break fast with family/friends', icon: '🍽️' },
  { day: 7, title: 'Week 1 Done!', desc: 'Complete first week of Ramadan', icon: '⭐' },
  { day: 8, title: 'Qiamullail', desc: 'Attend night prayer session', icon: '🌟' },
  { day: 9, title: 'Dhikr Session', desc: 'Do 100x SubhanAllah', icon: '📿' },
  { day: 10, title: 'Volunteer', desc: 'Help at mosque or community', icon: '🤝' },
  { day: 11, title: 'Share Ilmu', desc: 'Share an Islamic reminder', icon: '💬' },
  { day: 12, title: 'Suhoor Woke', desc: 'Wake up for Suhoor on time', icon: '⏰' },
  { day: 13, title: 'No Waste Day', desc: 'No food waste today', icon: '♻️' },
  { day: 14, title: 'Half Ramadan!', desc: '2 weeks down, keep going!', icon: '🎯' },
  { day: 15, title: 'Tahajjud', desc: 'Pray 2 rakaat Tahajjud', icon: '🌠' },
  { day: 16, title: 'Visit Silaturahim', desc: 'Visit a relative or neighbor', icon: '🏡' },
  { day: 17, title: 'Lailatul Qadr Hunt', desc: 'Extra ibadah on odd nights', icon: '✨' },
  { day: 18, title: 'Khatam Journey', desc: 'Read Quran extra portion', icon: '📚' },
  { day: 19, title: 'Feed Others', desc: 'Provide iftar for someone', icon: '🥘' },
  { day: 20, title: 'Week 3 Strong!', desc: 'Third week almost done', icon: '💪' },
  { day: 21, title: 'Last 10 Begins', desc: 'Enter the last 10 nights', icon: '🌙' },
  { day: 22, title: 'I\'tikaf Spirit', desc: 'Spend extra time at mosque', icon: '🕌' },
  { day: 23, title: 'Lailatul Qadr 1', desc: 'Night of Power — 23rd', icon: '⭐' },
  { day: 24, title: 'Zakat Fitrah', desc: 'Pay Zakat Fitrah', icon: '💰' },
  { day: 25, title: 'Lailatul Qadr 2', desc: 'Night of Power — 25th', icon: '🌟' },
  { day: 26, title: 'Full Quran Day', desc: 'Read a full juz today', icon: '📖' },
  { day: 27, title: 'Lailatul Qadr 3', desc: 'Night of Power — 27th', icon: '✨' },
  { day: 28, title: 'Last Days', desc: 'Intensify worship', icon: '🤲' },
  { day: 29, title: 'Near End', desc: 'Final push in Ramadan', icon: '🎯' },
  { day: 30, title: 'Ramadan Complete!', desc: 'You completed 30 days!', icon: '🏆' },
]

export default function BingoGrid() {
  const { user } = useAuth()
  const [completed, setCompleted] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    if (user) fetchProgress()
    else setLoading(false)
  }, [user])

  async function fetchProgress() {
    try {
      const { data } = await supabase
        .from('tarawihtribe_bingo_progress')
        .select('day_number')
        .eq('user_id', user.id)

      if (data) {
        setCompleted(new Set(data.map(r => r.day_number)))
      }
    } catch {
      // Use local state
    } finally {
      setLoading(false)
    }
  }

  async function toggleDay(day) {
    if (!user || toggling) return
    setToggling(day)
    const isCompleted = completed.has(day)

    // Optimistic update
    setCompleted(prev => {
      const next = new Set(prev)
      if (isCompleted) next.delete(day)
      else next.add(day)
      return next
    })

    try {
      if (isCompleted) {
        await supabase
          .from('tarawihtribe_bingo_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('day_number', day)
      } else {
        await supabase.from('tarawihtribe_bingo_progress').upsert({
          user_id: user.id,
          day_number: day,
          completed_at: new Date().toISOString(),
        })

        // Log activity for friend feed
        await supabase.from('tarawihtribe_activities').insert({
          user_id: user.id,
          type: 'bingo_complete',
          data: { day, title: BINGO_CHALLENGES[day - 1].title },
          created_at: new Date().toISOString(),
        }).catch(() => {})
      }
    } catch {
      // Error handled, keep optimistic update
    } finally {
      setToggling(null)
    }
  }

  const completedCount = completed.size
  const percentage = Math.round((completedCount / 30) * 100)

  if (loading) return (
    <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading your bingo..." /></div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-purple-400" />
            30-Day Ramadan Bingo
          </h2>
          <p className="text-slate-400 text-sm mt-1">Complete daily challenges to earn your star</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors glass rounded-xl px-3 py-2">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Progress */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-sm">Your Progress</p>
            <p className="text-3xl font-bold gradient-text">{completedCount}/30</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Completion</p>
            <p className="text-3xl font-bold text-white">{percentage}%</p>
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full gradient-bg transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {completedCount === 30 && (
          <div className="mt-3 text-center text-yellow-400 font-bold animate-pulse">
            🏆 RAMADAN CHAMPION! You did it! 🏆
          </div>
        )}
      </div>

      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {BINGO_CHALLENGES.map(challenge => {
          const isDone = completed.has(challenge.day)
          const isToggling = toggling === challenge.day

          return (
            <button
              key={challenge.day}
              onClick={() => toggleDay(challenge.day)}
              disabled={isToggling}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 group ${
                isDone
                  ? 'gradient-bg shadow-lg shadow-purple-500/25 scale-[0.98]'
                  : 'glass hover:border-purple-500/50 hover:scale-[1.02]'
              }`}
            >
              {isToggling ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span className="text-lg sm:text-xl">{challenge.icon}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-white mt-1">{challenge.day}</span>
                  {isDone && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" />
                    </div>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Tooltip / hover info - show on larger screens */}
      <div className="glass rounded-2xl p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          Today's Challenge
        </h3>
        {BINGO_CHALLENGES.slice(0, 3).filter(c => !completed.has(c.day)).slice(0, 1).map(challenge => (
          <div key={challenge.day} className="flex items-center gap-4">
            <div className="text-3xl">{challenge.icon}</div>
            <div>
              <p className="font-medium text-white">Day {challenge.day}: {challenge.title}</p>
              <p className="text-sm text-slate-400">{challenge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
