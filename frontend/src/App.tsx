import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './components/LoginPage'
import DiagnosticsInputPage from './components/DiagnosticsInputPage'
import AdminDashboard from './components/AdminDashboard'
import UserHistory from './components/UserHistory'
import DraftsPage from './components/DraftsPage'
import AIChatPage from './components/AIChatPage'

type ViewMode = 'diagnostics' | 'history' | 'admin' | 'drafts' | 'chat'

function AppContent() {
  const { user, logout, isLoading } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('diagnostics')
  const [draftCount, setDraftCount] = useState(0)
  const [systemConfigured, setSystemConfigured] = useState(false)
  const [chatTransferData, setChatTransferData] = useState<{
    messages: any[]
    diagnosticContext?: any
  } | null>(null)

  // Update draft count from localStorage
  useEffect(() => {
    const updateDraftCount = () => {
      const drafts = JSON.parse(localStorage.getItem('fieldlink_drafts') || '[]')
      setDraftCount(drafts.length)
    }

    updateDraftCount()

    // Listen for storage changes
    window.addEventListener('storage', updateDraftCount)
    window.addEventListener('draftsUpdated', updateDraftCount)

    return () => {
      window.removeEventListener('storage', updateDraftCount)
      window.removeEventListener('draftsUpdated', updateDraftCount)
    }
  }, [])

  // Check system configuration status
  useEffect(() => {
    const checkSystemConfig = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.log('No token available for system config check')
          return
        }

        const response = await fetch('/api/system-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSystemConfigured(data.configured)
        } else if (response.status === 401) {
          console.log('System config check: unauthorized (expected if not logged in)')
        } else {
          console.error('System config check failed:', response.status)
        }
      } catch (err) {
        console.error('Failed to check system configuration:', err)
      }
    }

    if (user) {
      checkSystemConfig()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(26,31,46,0.95)] backdrop-blur-lg border-b border-blue-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto px-8 py-3">
          <div className="flex items-center justify-between">
            <div
              onClick={() => setViewMode('diagnostics')}
              className="text-2xl font-bold text-white tracking-tight cursor-pointer hover:text-blue-400 transition-colors"
            >
              FieldLink
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('diagnostics')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                  viewMode === 'diagnostics'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-blue-500/10 hover:-translate-y-0.5'
                }`}
              >
                Diagnostics
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                  viewMode === 'history'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-blue-500/10 hover:-translate-y-0.5'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setViewMode('chat')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                  viewMode === 'chat'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-blue-500/10 hover:-translate-y-0.5'
                }`}
              >
                Sensei
              </button>
              {draftCount > 0 && (
                <button
                  onClick={() => setViewMode('drafts')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                    viewMode === 'drafts'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-blue-500/10 hover:-translate-y-0.5'
                  }`}
                >
                  Drafts
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {draftCount}
                  </span>
                </button>
              )}
              {user.role === 'admin' && (
                <button
                  onClick={() => setViewMode('admin')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                    viewMode === 'admin'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-blue-500/10 hover:-translate-y-0.5'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-semibold text-white">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500">
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
              <button
                onClick={logout}
                className="px-6 py-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header - Only show on diagnostics page */}
      {viewMode === 'diagnostics' && (
        <header className="relative text-center px-8 pt-32 pb-24 overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)] animate-[pulse_8s_ease-in-out_infinite]" />

          {/* Floating particles */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-500/50 rounded-full animate-[float_15s_infinite]"
                style={{
                  left: `${(i + 1) * 10}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-4 mb-4 animate-[slideDown_0.8s_ease-out]">
              <h1
                className="text-7xl font-extrabold tracking-tighter text-slate-800 dark:text-white"
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                FieldLink
              </h1>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-[checkPulse_2s_ease-in-out_infinite]">
                <svg className="w-7 h-7 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                  <polyline
                    points="20 6 9 17 4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-[drawCheck_1s_ease-out_forwards]"
                    style={{
                      strokeDasharray: 50,
                      strokeDashoffset: systemConfigured ? 0 : 50
                    }}
                  />
                </svg>
              </div>
            </div>

            <p className="text-xl text-slate-600 dark:text-slate-300 font-semibold mt-4 animate-[fadeIn_1s_ease-out_0.3s_both]" style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.1)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text'
            }}>
              Professional diagnostic assistant for HVAC technicians
            </p>

            <div className="flex justify-center gap-12 mt-12 animate-[fadeIn_1s_ease-out_0.6s_both]">
              <div className="text-center p-6 px-8 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:bg-blue-500/15 hover:shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                <div className="text-3xl font-bold text-blue-500 mb-2">24/7</div>
                <div className="text-slate-400 text-sm font-medium">Always Available</div>
              </div>
              <div className="text-center p-6 px-8 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:bg-blue-500/15 hover:shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                <div className="text-3xl font-bold text-blue-500 mb-2">99.9%</div>
                <div className="text-slate-400 text-sm font-medium">Accuracy Rate</div>
              </div>
              <div className="text-center p-6 px-8 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:bg-blue-500/15 hover:shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                <div className="text-3xl font-bold text-blue-500 mb-2">&lt; 2min</div>
                <div className="text-slate-400 text-sm font-medium">Avg Response Time</div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className={viewMode === 'diagnostics' || viewMode === 'chat' ? '' : 'pt-20 bg-gray-900'}>
        {viewMode === 'diagnostics' && <DiagnosticsInputPage onNavigateToHistory={() => setViewMode('history')} onNavigateToChat={() => setViewMode('chat')} />}
        {viewMode === 'history' && (
          <UserHistory
            onNavigateToChat={(messages, diagnosticContext) => {
              setChatTransferData({ messages, diagnosticContext })
              setViewMode('chat')
            }}
          />
        )}
        {viewMode === 'chat' && (
          <AIChatPage
            initialMessages={chatTransferData?.messages}
            initialDiagnosticContext={chatTransferData?.diagnosticContext}
            onMount={() => setChatTransferData(null)}
          />
        )}
        {viewMode === 'drafts' && <DraftsPage onLoadDraft={() => setViewMode('diagnostics')} />}
        {viewMode === 'admin' && <AdminDashboard />}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1) rotate(180deg);
            opacity: 0.5;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes checkPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.8);
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(100px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
