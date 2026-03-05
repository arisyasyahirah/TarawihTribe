import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoader } from './components/LoadingSpinner'
import AuthForm from './components/AuthForm'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import CrowdMap from './pages/CrowdMap'
import BingoGrid from './pages/BingoGrid'
import FriendFeed from './pages/FriendFeed'
import Events from './pages/Events'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import Notifications from './pages/Notifications'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user) return <AuthForm />

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-20 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crowd" element={<CrowdMap />} />
          <Route path="/bingo" element={<BingoGrid />} />
          <Route path="/feed" element={<FriendFeed />} />
          <Route path="/events" element={<Events />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
