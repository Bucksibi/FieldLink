import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DiagnosticResult } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'
import DiagnosticDetailsModal from '../DiagnosticDetailsModal'
import SenseiChatModal from '../SenseiChatModal'
import { printDiagnostic } from '../../utils/printDiagnostic'

interface DiagnosticRecord {
  id: string
  locationAddress?: string | null
  equipmentModel?: string | null
  equipmentSerial?: string | null
  systemType: string
  refrigerant: string | null
  readings: Record<string, number>
  userNotes: string | null
  modelId: string
  result: DiagnosticResult
  createdAt: string
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

interface UserHistoryEnhancedProps {
  onNavigateToChat?: (messages: any[], diagnosticContext?: any) => void
}

export default function UserHistoryEnhanced({ onNavigateToChat }: UserHistoryEnhancedProps = {}) {
  const { token } = useAuth()
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<DiagnosticRecord | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [editedNotes, setEditedNotes] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [starred, setStarred] = useState<Set<string>>(new Set())
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [chatDiagnostic, setChatDiagnostic] = useState<DiagnosticRecord | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [systemTypeFilter, setSystemTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    fetchHistory()
  }, [token])

  const fetchHistory = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/diagnostics/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()
      setDiagnostics(data.diagnostics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'normal':
        return {
          label: 'NORMAL',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: 'check'
        }
      case 'attention_needed':
        return {
          label: 'WARNING',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)',
          icon: 'warning'
        }
      case 'critical':
        return {
          label: 'CRITICAL',
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: 'error'
        }
      default:
        return {
          label: status.toUpperCase(),
          color: '#8B949E',
          bg: 'rgba(139, 148, 158, 0.15)',
          border: 'rgba(139, 148, 158, 0.3)',
          icon: 'info'
        }
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/diagnostics/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete diagnostic')
      }

      setDiagnostics(prev => prev.filter(d => d.id !== id))
      setDeleteConfirm(null)
      setSelectedRecord(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete diagnostic')
    }
  }

  const handleUpdateNotes = async (id: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/diagnostics/${id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userNotes: editedNotes })
      })

      if (!response.ok) {
        throw new Error('Failed to update notes')
      }

      setDiagnostics(prev => prev.map(d =>
        d.id === id ? { ...d, userNotes: editedNotes } : d
      ))

      if (selectedRecord?.id === id) {
        setSelectedRecord({ ...selectedRecord, userNotes: editedNotes })
      }

      setEditingNotes(null)
      setEditedNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes')
    }
  }

  const startEditNotes = (record: DiagnosticRecord) => {
    setEditingNotes(record.id)
    setEditedNotes(record.userNotes || '')
  }

  const toggleStar = (id: string) => {
    setStarred(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Filter and sort diagnostics
  const filteredDiagnostics = diagnostics
    .filter(d => {
      if (statusFilter !== 'all' && d.result.system_status !== statusFilter) return false
      if (systemTypeFilter !== 'all' && d.systemType !== systemTypeFilter) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          d.systemType.toLowerCase().includes(search) ||
          d.result.summary.toLowerCase().includes(search) ||
          (d.userNotes && d.userNotes.toLowerCase().includes(search)) ||
          (d.locationAddress && d.locationAddress.toLowerCase().includes(search))
        )
      }
      return true
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime
    })

  const uniqueSystemTypes = [...new Set(diagnostics.map(d => d.systemType))]

  // Stats
  const totalCount = filteredDiagnostics.length
  const normalCount = filteredDiagnostics.filter(d => d.result.system_status === 'normal').length
  const warningCount = filteredDiagnostics.filter(d => d.result.system_status === 'attention_needed').length
  const criticalCount = filteredDiagnostics.filter(d => d.result.system_status === 'critical').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D1117' }}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <svg className="w-full h-full animate-spin" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(230, 126, 34, 0.2)" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E67E22" strokeWidth="8" strokeLinecap="round" strokeDasharray="60 190" />
            </svg>
          </div>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681', fontSize: '12px' }}>
            LOADING HISTORY...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ background: '#0D1117' }}>
        <div className="max-w-4xl mx-auto p-6 rounded-xl" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 rounded-lg font-medium"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#fff' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#0D1117' }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
          >
            Diagnostic <span style={{ color: '#E67E22' }}>History</span>
          </h1>
          <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
            View and manage your diagnostic reports
          </p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.15) 0%, rgba(211, 84, 0, 0.1) 100%)',
            border: '1px solid rgba(230, 126, 34, 0.3)',
            boxShadow: '0 4px 30px rgba(230, 126, 34, 0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
                  boxShadow: '0 4px 20px rgba(230, 126, 34, 0.4)'
                }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div
                  className="text-4xl font-bold"
                  style={{ fontFamily: '"JetBrains Mono", monospace', color: '#F0F6FC' }}
                >
                  {totalCount}
                </div>
                <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
                  Diagnostics Found
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {normalCount > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#10B981' }}>
                    {normalCount}
                  </div>
                  <div className="text-xs" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681' }}>NORMAL</div>
                </div>
              )}
              {warningCount > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#F59E0B' }}>
                    {warningCount}
                  </div>
                  <div className="text-xs" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681' }}>WARNING</div>
                </div>
              )}
              {criticalCount > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#EF4444' }}>
                    {criticalCount}
                  </div>
                  <div className="text-xs" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681' }}>CRITICAL</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(240, 246, 252, 0.1)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search diagnostics..."
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(240, 246, 252, 0.1)',
                  color: '#F0F6FC',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none cursor-pointer"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(240, 246, 252, 0.1)',
                  color: '#F0F6FC',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="normal">Normal</option>
                <option value="attention_needed">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* System Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
                System Type
              </label>
              <select
                value={systemTypeFilter}
                onChange={(e) => setSystemTypeFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none cursor-pointer"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(240, 246, 252, 0.1)',
                  color: '#F0F6FC',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              >
                <option value="all">All Systems</option>
                {uniqueSystemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="w-full px-4 py-3 rounded-xl outline-none cursor-pointer"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(240, 246, 252, 0.1)',
                  color: '#F0F6FC',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || systemTypeFilter !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setSystemTypeFilter('all')
                }}
                className="text-sm hover:underline"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#E67E22' }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Diagnostics Grid */}
        {filteredDiagnostics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(240, 246, 252, 0.1)',
            }}
          >
            <div className="text-6xl mb-4">
              <svg className="w-16 h-16 mx-auto" style={{ color: '#6E7681' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}>
              No diagnostics found
            </h3>
            <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
              {searchTerm || statusFilter !== 'all' || systemTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You haven't run any diagnostics yet"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiagnostics.map((record, index) => {
              const isStarred = starred.has(record.id)
              const statusConfig = getStatusConfig(record.result.system_status)

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: `1px solid ${statusConfig.border}`,
                    boxShadow: isStarred ? `0 0 30px ${statusConfig.bg}` : 'none',
                  }}
                  onClick={() => setSelectedRecord(record)}
                >
                  {/* Star Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(record.id)
                    }}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-200"
                    style={{
                      background: isStarred ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                      border: isStarred ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(240, 246, 252, 0.1)',
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isStarred ? '#F59E0B' : 'none'}
                      stroke={isStarred ? '#F59E0B' : '#8B949E'}
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Status Badge */}
                  <div className="p-4 pb-2">
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      {statusConfig.icon === 'check' && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {statusConfig.icon === 'warning' && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      {statusConfig.icon === 'error' && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 pt-2">
                    <h3
                      className="text-xl font-bold mb-1"
                      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
                    >
                      {record.systemType}
                    </h3>

                    {record.refrigerant && (
                      <p className="text-sm mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E' }}>
                        Refrigerant: <span style={{ color: '#14B8A6' }}>{record.refrigerant}</span>
                      </p>
                    )}

                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#6E7681' }}
                    >
                      {record.result.summary}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                        style={{
                          background: 'rgba(20, 184, 166, 0.15)',
                          color: '#14B8A6',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        {record.result.faults.length} issue{record.result.faults.length !== 1 ? 's' : ''}
                      </span>
                      <span
                        className="text-xs"
                        style={{ fontFamily: '"JetBrains Mono", monospace', color: '#6E7681' }}
                      >
                        {formatDate(record.createdAt)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            printDiagnostic(record)
                          }}
                          className="px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#fff',
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditNotes(record)
                          }}
                          className="px-3 py-2 rounded-lg text-sm font-medium"
                          style={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            color: '#fff',
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                          }}
                        >
                          Edit Notes
                        </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setChatDiagnostic(record)
                          setChatModalOpen(true)
                        }}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                        style={{
                          background: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
                          color: '#fff',
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          boxShadow: '0 4px 15px rgba(230, 126, 34, 0.3)',
                        }}
                      >
                        Ask AI About This
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm(record.id)
                        }}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#EF4444',
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                        }}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <DiagnosticDetailsModal
          isOpen={true}
          onClose={() => setSelectedRecord(null)}
          result={selectedRecord.result}
          inputDetails={{
            locationAddress: selectedRecord.locationAddress || undefined,
            systemType: selectedRecord.systemType,
            refrigerant: selectedRecord.refrigerant || undefined,
            readings: selectedRecord.readings,
            userNotes: selectedRecord.userNotes || undefined,
          }}
          onAskAI={onNavigateToChat}
        />
      )}

      {/* Edit Notes Modal */}
      <AnimatePresence>
        {editingNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => {
              setEditingNotes(null)
              setEditedNotes('')
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                border: '1px solid rgba(240, 246, 252, 0.1)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
              >
                Edit Technician Notes
              </h3>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl outline-none resize-none mb-4"
                placeholder="Add your notes here..."
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(240, 246, 252, 0.1)',
                  color: '#F0F6FC',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUpdateNotes(editingNotes)}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
                    color: '#fff',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  }}
                >
                  Save Changes
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setEditingNotes(null)
                    setEditedNotes('')
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(240, 246, 252, 0.1)',
                    color: '#8B949E',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239, 68, 68, 0.15)' }}
                >
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3
                    className="text-lg font-bold"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F0F6FC' }}
                  >
                    Delete Diagnostic?
                  </h3>
                  <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#8B949E', fontSize: '14px' }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#fff',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  }}
                >
                  Delete
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(240, 246, 252, 0.1)',
                    color: '#8B949E',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sensei Chat Modal */}
      <SenseiChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false)
          setChatDiagnostic(null)
        }}
        onOpenFullChat={(messages, diagnosticContext) => {
          setChatModalOpen(false)
          setChatDiagnostic(null)
          if (onNavigateToChat) {
            onNavigateToChat(messages, diagnosticContext)
          }
        }}
        diagnosticContext={
          chatDiagnostic
            ? {
                result: chatDiagnostic.result,
                systemType: chatDiagnostic.systemType,
                refrigerant: chatDiagnostic.refrigerant || undefined,
                readings: chatDiagnostic.readings,
              }
            : undefined
        }
      />
    </div>
  )
}
