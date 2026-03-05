export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-purple-500/30 border-t-purple-500 animate-spin`}
      />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <p className="text-slate-400 font-light tracking-widest text-sm uppercase">Loading...</p>
      </div>
    </div>
  )
}
