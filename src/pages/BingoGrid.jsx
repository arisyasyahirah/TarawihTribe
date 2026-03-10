import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, Star, Grid3X3, Share2 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const BINGO_CHALLENGES = [
  { day: 1, title: 'Pray terawih at mosque', desc: 'Attend Terawih prayer at Masjid', icon: '🕌' },
  { day: 2, title: 'Bring friend to mosque', desc: 'Invite a friend to pray together', icon: '🤝' },
  { day: 3, title: 'Donate RM1 to mosque', desc: 'Give any amount of charity', icon: '💝' },
  { day: 4, title: 'Read 1 page Quran', desc: 'Read at least 1 page of Quran', icon: '📖' },
  { day: 5, title: 'Help someone find parking', desc: 'Assist someone with parking', icon: '🚗' },
  { day: 6, title: 'Break fast at mosque', desc: 'Iftar at the mosque', icon: '🍽️' },
  { day: 7, title: 'Smile at 5 people', desc: 'Spread positivity', icon: '😊' },
  { day: 8, title: 'Bring dates for iftar', desc: 'Bring dates to share for iftar', icon: '🌴' },
  { day: 9, title: 'Pray 5 prayers at mosque', desc: 'Pray all 5 daily prayers at mosque', icon: '🙏' },
  { day: 10, title: 'Learn 1 new surah', desc: 'Memorize a new surah', icon: '📚' },
  { day: 11, title: 'Help clean mosque area', desc: 'Volunteer to clean', icon: '🧹' },
  { day: 12, title: 'Give salam to 10 people', desc: 'Greet others with salam', icon: '👋' },
  { day: 13, title: 'Bring water for wudhu', desc: 'Contribute water for wudhu', icon: '💧' },
  { day: 14, title: 'Pray sunnah prayers', desc: 'Perform sunnah prayers', icon: '⭐' },
  { day: 15, title: 'Donate old Quran', desc: 'Give old Quran to mosque', icon: '📕' },
  { day: 16, title: 'Help elderly find seat', desc: 'Assist elderly to sit', icon: '👴' },
  { day: 17, title: 'Read Quran 15 minutes', desc: 'Read Quran for 15 minutes', icon: '⏱️' },
  { day: 18, title: 'Bring snack for volunteers', desc: 'Pack snacks for volunteers', icon: '🍪' },
  { day: 19, title: 'Pray full terawih', desc: 'Complete full 20 rakaat', icon: '🏆' },
  { day: 20, title: 'Listen to kuliah', desc: 'Attend Islamic lecture', icon: '🎤' },
  { day: 21, title: 'Bring family to mosque', desc: 'Bring family for terawih', icon: '👨‍👩‍👧' },
  { day: 22, title: 'Donate to mosque box', desc: 'Give to mosque donation box', icon: '💰' },
  { day: 23, title: 'Help prepare iftar', desc: 'Help prepare food for iftar', icon: '🥘' },
  { day: 24, title: 'Pray qiamullail', desc: 'Perform night prayer', icon: '🌙' },
  { day: 25, title: 'Recite Quran after subuh', desc: 'Read Quran after morning prayer', icon: '🌅' },
  { day: 26, title: 'Bring non-Muslim friend', desc: 'Invite non-Muslim friend', icon: '🌍' },
  { day: 27, title: 'Do 10 push-ups', desc: 'Stay physically healthy', icon: '💪' },
  { day: 28, title: 'Thank mosque cleaner', desc: 'Appreciate the cleaners', icon: '🙌' },
  { day: 29, title: 'Help clean for Eid', desc: 'Prepare mosque for Eid', icon: '🧹' },
  { day: 30, title: "Make du'a for community", desc: 'Pray for the community', icon: '🤲' },
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
