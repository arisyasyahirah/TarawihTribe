import { Link, useLocation } from 'react-router-dom'
import { Home, Map, Grid3X3, Users, Calendar } from 'lucide-react'

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/crowd', icon: Map, label: 'Crowd' },
  { path: '/bingo', icon: Grid3X3, label: 'Bingo' },
  { path: '/feed', icon: Users, label: 'Feed' },
  { path: '/events', icon: Calendar, label: 'Events' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-purple-500/20">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                active ? 'text-purple-400' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
