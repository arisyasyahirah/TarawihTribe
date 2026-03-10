import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, Star, Grid3X3, Share2 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

async function handleShare(completedCount) {
  const text = `🕌 I'm doing ${completedCount}/30 days of Ramadan Bingo! Join me at TarawihTribe!`
  
  if (navigator.share) {
    try {
      await navigator.share({ title: 'TarawihTribe Ramadan Bingo', text })
    } catch { /* user cancelled */ }
  } else {
    await navigator.clipboard.writeText(text)
    alert('Copied to clipboard! Share on your social media 📱')
  }
}

const BINGO_CHALLENGES = [
  {day: 'Pray terawih at mosque', desc: 'Attend Terawih prayer at Masjid', icon: '🕌' },
  { day:'Bring friend to mosque', desc: 'Invite a friend to pray together', icon: '🤝' },
  { day: 'Donate RM1 to mosque', desc: 'Give any amount of charity', icon: '💝' },
  { day: 'Read 1 page Quran', desc: 'Read at least 1 page of Quran', icon: '📖' },
  { day: 'Help someone find parking', desc: 'Assist someone with parking', icon: '🚗' },
  { day: 'Break fast at mosque', desc: 'Iftar at the mosque', icon: '🍽️' },
  { day: 'Smile at 5 people', desc: 'Spread positivity', icon: '😊' },
  { day: 'Bring dates for iftar', desc: 'Bring dates to share for iftar', icon: '🌴' },
  { day: 'Pray 5 prayers at mosque', desc: 'Pray all 5 daily prayers at mosque', icon: '🙏' },
  { day: 'Learn 1 new surah', desc: 'Memorize a new surah', icon: '📚' },
  { day: 'Help clean mosque area', desc: 'Volunteer to clean', icon: '🧹' },
  { day: 'Give salam to 10 people', desc: 'Greet others with salam', icon: '👋' },
  { day: 'Bring water for wudhu', desc: 'Contribute water for wudhu', icon: '💧' },
  { day: 'Pray sunnah prayers', desc: 'Perform sunnah prayers', icon: '⭐' },
  { day: 'Donate old Quran', desc: 'Give old Quran to mosque', icon: '📕' },
  { day: 'Help elderly find seat', desc: 'Assist elderly to sit', icon: '👴' },
  { day: 'Read Quran 15 minutes', desc: 'Read Quran for 15 minutes', icon: '⏱️' },
  { day: 'Bring snack for volunteers', desc: 'Pack snacks for volunteers', icon: '🍪' },
  { day: 'Pray full terawih', desc: 'Complete full 20 rakaat', icon: '🏆' },
  { day: 'Listen to kuliah', desc: 'Attend Islamic lecture', icon: '🎤' },
  { day: 'Bring family to mosque', desc: 'Bring family for terawih', icon: '👨‍👩‍👧' },
  { day: 'Donate to mosque box', desc: 'Give to mosque donation box', icon: '💰' },
  { day: 'Help prepare iftar', desc: 'Help prepare food for iftar', icon: '🥘' },
  { day: 'Pray qiamullail', desc: 'Perform night prayer', icon: '🌙' },
  { day: 'Recite Quran after subuh', desc: 'Read Quran after morning prayer', icon: '🌅' },
  { day: 'Bring non-Muslim friend', desc: 'Invite non-Muslim friend', icon: '🌍' },
  { day: 'Do 10 push-ups', desc: 'Stay physically healthy', icon: '💪' },
  { day: 'Thank mosque cleaner', desc: 'Appreciate the cleaners', icon: '🙌' },
  { day: 'Help clean for Eid', desc: 'Prepare mosque for Eid', icon: '🧹' },
  { day:  "Make du'a for community", desc: 'Pray for the community', icon: '🤲' },
]

const getStorageKey = (userId) => `tarawihtribe_bingo_${userId || 'demo'}`

export default function BingoGrid() {
  const { user } = useAuth()
  const [completed, setCompleted] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    if (user) {
      fetchProgress()
    } else {
      const saved = localStorage.getItem(getStorageKey('demo'))
      if (saved) {
        setCompleted(new Set(JSON.parse(saved)))
      }
      setLoading(false)
    }
  }, [user])

  async function fetchProgress() {
    const storageKey = getStorageKey(user.id)
    const localData = localStorage.getItem(storageKey)
    if (localData) {
      setCompleted(new Set(JSON.parse(localData)))
    }

    try {
      const { data } = await supabase
        .from('tarawihtribe_bingo_progress')
        .select('day_number')
        .eq('user_id', user.id)

      if (data && data.length > 0) {
        const cloudDays = new Set(data.map(r => r.day_number))
        setCompleted(cloudDays)
        localStorage.setItem(storageKey, JSON.stringify([...cloudDays]))
      }
    } catch (e) {
      // Use local data
    }
    setLoading(false)
  }

  async function toggleDay(day) {
    if (toggling) return
    setToggling(day)
    const isCompleted = completed.has(day)
    const storageKey = getStorageKey(user?.id)

    const newSet = new Set(completed)
    if (isCompleted) {
      newSet.delete(day)
    } else {
      newSet.add(day)
    }
    setCompleted(newSet)
    localStorage.setItem(storageKey, JSON.stringify([...newSet]))

    if (user) {
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
        }
      } catch (e) {
        // Already saved to localStorage
      }
    }

    setToggling(null)
  }

  const completedCount = completed.size
  const percentage = Math.round((completedCount / 30) * 100)

  if (loading) return (
    <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading your bingo..." /></div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-purple-400" />
            30-Day Ramadan Bingo
          </h2>
          <p className="text-slate-400 text-sm mt-1">Complete daily challenges to earn your star</p>
        </div>
        <button 
          onClick={() => handleShare(completedCount)}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors glass rounded-xl px-3 py-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

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
          <div className="h-full rounded-full gradient-bg transition-all duration-700" style={{ width: `${percentage}%` }} />
        </div>
        {completedCount === 30 && (
          <div className="mt-3 text-center text-yellow-400 font-bold animate-pulse">
            🏆 RAMADAN CHAMPION! You did it! 🏆
          </div>
        )}
      </div>

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
