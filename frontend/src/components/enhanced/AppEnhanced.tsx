import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import LoginPageEnhanced from './LoginPageEnhanced'
import DiagnosticsInputPageEnhanced from './DiagnosticsInputPageEnhanced'
import UserHistoryEnhanced from './UserHistoryEnhanced'
import AIChatPageEnhanced from './AIChatPageEnhanced'
import AdminDashboard from '../AdminDashboard'
import DraftsPage from '../DraftsPage'
import ErrorBoundary from '../ErrorBoundary'

type ViewMode = 'diagnostics' | 'history' | 'admin' | 'drafts' | 'chat'

function AppContentEnhanced() {
  const { user, logout, isLoading } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('diagnostics')
  const [draftCount, setDraftCount] = useState(0)
  const [systemConfigured, setSystemConfigured] = useState(false)
  const [chatTransferData, setChatTransferData] = useState<{
    messages: any[]
    diagnosticContext?: any
  } | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Update draft count
  useEffect(() => {
    const updateDraftCount = () => {
      const drafts = JSON.parse(localStorage.getItem('fieldlink_drafts') || '[]')
      setDraftCount(drafts.length)
    }
    updateDraftCount()
    window.addEventListener('storage', updateDraftCount)
    window.addEventListener('draftsUpdated', updateDraftCount)
    return () => {
      window.removeEventListener('storage', updateDraftCount)
      window.removeEventListener('draftsUpdated', updateDraftCount)
    }
  }, [])

  // Check system configuration
  useEffect(() => {
    const checkSystemConfig = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const response = await fetch('/api/system-config', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setSystemConfigured(data.configured)
        }
      } catch (err) {
        console.error('Failed to check system configuration:', err)
      }
    }
    if (user) checkSystemConfig()
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D1117' }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(211, 84, 0, 0.1) 100%)',
              border: '1px solid rgba(230, 126, 34, 0.3)',
            }}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681', fontSize: '12px' }}>
            INITIALIZING SYSTEM...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPageEnhanced />
  }

  const navItems = [
    { id: 'diagnostics', label: 'Diagnostics', icon: DiagnosticsIcon },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'chat', label: 'Sensei AI', icon: ChatIcon, highlight: true },
  ]

  if (draftCount > 0) {
    navItems.push({ id: 'drafts', label: 'Drafts', icon: DraftsIcon, badge: draftCount })
  }

  if (user.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: AdminIcon })
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D1117' }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Enhanced Navigation Bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(13, 17, 23, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(240, 246, 252, 0.1)',
        }}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setViewMode('diagnostics')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(211, 84, 0, 0.1) 100%)',
                  border: '1px solid rgba(230, 126, 34, 0.3)',
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span
                className="text-xl font-bold"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
              >
                Field<span style={{ color: '#E67E22' }}>Link</span>
              </span>
            </motion.div>

            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  active={viewMode === item.id}
                  onClick={() => setViewMode(item.id as ViewMode)}
                  icon={<item.icon />}
                  label={item.label}
                  highlight={item.highlight}
                  badge={item.badge}
                />
              ))}
            </div>

            {/* Right Side - User Info & Status */}
            <div className="flex items-center gap-4">
              {/* System Status Indicator */}
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(240, 246, 252, 0.1)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: systemConfigured ? '#10B981' : '#F59E0B',
                    boxShadow: systemConfigured
                      ? '0 0 8px rgba(16, 185, 129, 0.6)'
                      : '0 0 8px rgba(245, 158, 11, 0.6)',
                  }}
                />
                <span
                  className="text-xs"
                  style={{ fontFamily: '"JetBrains Mono", monospace', color: '#8B949E' }}
                >
                  {systemConfigured ? 'ONLINE' : 'CONFIG'}
                </span>
              </div>

              {/* Time Display */}
              <div
                className="hidden lg:block text-xs tabular-nums"
                style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681' }}
              >
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
                  >
                    {user.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681' }}
                  >
                    {user.role === 'admin' ? 'ADMIN' : 'TECH'}
                  </p>
                </div>

                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                  }}
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Only on Diagnostics */}
      <AnimatePresence mode="wait">
        {viewMode === 'diagnostics' && (
          <motion.header
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative pt-24 pb-16 overflow-hidden"
          >
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03]">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="heroGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#E67E22" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#heroGrid)" />
              </svg>
            </div>

            {/* Radial Glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-30"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(230, 126, 34, 0.2) 0%, transparent 60%)',
              }}
            />

            <div className="relative z-10 container mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1
                  className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
                >
                  HVAC <span style={{ color: '#E67E22' }}>Diagnostics</span>
                </h1>
                <p
                  className="text-lg max-w-2xl mx-auto"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}
                >
                  Professional diagnostic assistant powered by AI. Enter system readings for instant analysis.
                </p>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="flex justify-center gap-6 mt-10"
              >
                <StatCard label="Response Time" value="< 2s" />
                <StatCard label="AI Model" value="Gemini" color="#14B8A6" />
                <StatCard label="Accuracy" value="99.9%" color="#10B981" />
              </motion.div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={viewMode === 'diagnostics' ? '' : 'pt-20'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'diagnostics' && (
              <ErrorBoundary fallbackMessage="The diagnostics page encountered an error. Please refresh and try again.">
                <DiagnosticsInputPageEnhanced
                  onNavigateToHistory={() => setViewMode('history')}
                  onNavigateToChat={() => setViewMode('chat')}
                />
              </ErrorBoundary>
            )}
            {viewMode === 'history' && (
              <ErrorBoundary fallbackMessage="The history page encountered an error. Please refresh and try again.">
                <UserHistoryEnhanced
                  onNavigateToChat={(messages, diagnosticContext) => {
                    setChatTransferData({ messages, diagnosticContext })
                    setViewMode('chat')
                  }}
                />
              </ErrorBoundary>
            )}
            {viewMode === 'chat' && (
              <ErrorBoundary fallbackMessage="The AI chat encountered an error. Please refresh and try again.">
                <AIChatPageEnhanced
                  initialMessages={chatTransferData?.messages}
                  initialDiagnosticContext={chatTransferData?.diagnosticContext}
                  onMount={() => setChatTransferData(null)}
                />
              </ErrorBoundary>
            )}
            {viewMode === 'drafts' && (
              <ErrorBoundary fallbackMessage="The drafts page encountered an error. Please refresh and try again.">
                <DraftsPage onLoadDraft={() => setViewMode('diagnostics')} />
              </ErrorBoundary>
            )}
            {viewMode === 'admin' && (
              <ErrorBoundary fallbackMessage="The admin dashboard encountered an error. Please refresh and try again.">
                <AdminDashboard />
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// Navigation Button Component
interface NavButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  highlight?: boolean
  badge?: number
}

function NavButton({ active, onClick, icon, label, highlight, badge }: NavButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
      style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        background: active
          ? highlight
            ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
            : 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)'
          : 'transparent',
        color: active ? '#fff' : '#8B949E',
        boxShadow: active
          ? highlight
            ? '0 4px 15px rgba(20, 184, 166, 0.3)'
            : '0 4px 15px rgba(230, 126, 34, 0.3)'
          : 'none',
      }}
    >
      <span className="w-4 h-4">{icon}</span>
      <span className="text-sm font-medium hidden md:inline">{label}</span>
      {badge !== undefined && (
        <span
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
          style={{ background: '#EF4444', color: '#fff' }}
        >
          {badge}
        </span>
      )}
    </motion.button>
  )
}

// Stat Card Component
function StatCard({ label, value, color = '#E67E22' }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="px-6 py-4 rounded-xl"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(240, 246, 252, 0.1)',
      }}
    >
      <div
        className="text-xs tracking-wider mb-1"
        style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681' }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold"
        style={{ fontFamily: '"JetBrains Mono", monospace', color }}
      >
        {value}
      </div>
    </div>
  )
}

// Icon Components
function DiagnosticsIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function DraftsIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// Main App Export
export default function AppEnhanced() {
  return (
    <AuthProvider>
      <AppContentEnhanced />
    </AuthProvider>
  )
}
