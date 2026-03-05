// Prayer times calculation for Kuala Lumpur, Malaysia
// Using fixed times for Ramadan period - can be replaced with API

const PRAYER_SCHEDULE = {
  fajr: '05:45',
  sunrise: '07:00',
  dhuhr: '13:15',
  asr: '16:30',
  maghrib: '19:20',
  isha: '20:30',
  terawih: '20:45',
}

export function getPrayerTimes() {
  return PRAYER_SCHEDULE
}

export function getNextPrayer() {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const prayers = [
    { name: 'Fajr', time: '05:45', arabicName: 'الفجر' },
    { name: 'Dhuhr', time: '13:15', arabicName: 'الظهر' },
    { name: 'Asr', time: '16:30', arabicName: 'العصر' },
    { name: 'Maghrib', time: '19:20', arabicName: 'المغرب' },
    { name: 'Isha', time: '20:30', arabicName: 'العشاء' },
    { name: 'Terawih', time: '20:45', arabicName: 'التراويح' },
  ]

  for (const prayer of prayers) {
    const [h, m] = prayer.time.split(':').map(Number)
    const prayerMinutes = h * 60 + m
    if (currentTime < prayerMinutes) {
      const diff = prayerMinutes - currentTime
      return {
        ...prayer,
        minutesUntil: diff,
        hoursUntil: Math.floor(diff / 60),
        minsUntil: diff % 60,
      }
    }
  }

  // If past all prayers, next is Fajr tomorrow
  const [h, m] = '05:45'.split(':').map(Number)
  const fajrMinutes = h * 60 + m + 24 * 60
  const diff = fajrMinutes - currentTime
  return {
    name: 'Fajr',
    arabicName: 'الفجر',
    time: '05:45',
    minutesUntil: diff,
    hoursUntil: Math.floor(diff / 60),
    minsUntil: diff % 60,
  }
}

export function getRamadanDay() {
  // Ramadan 2025 starts around March 1 - adjust as needed
  const ramadanStart = new Date('2025-03-01')
  const today = new Date()
  const diff = Math.floor((today - ramadanStart) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 30)
}
