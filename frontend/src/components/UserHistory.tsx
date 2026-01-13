import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DiagnosticResult } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import DiagnosticDetailsModal from './DiagnosticDetailsModal'
import SenseiChatModal from './SenseiChatModal'
import { printDiagnostic } from '../utils/printDiagnostic'

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

interface UserHistoryProps {
  onNavigateToChat?: (messages: any[], diagnosticContext?: any) => void
}

export default function UserHistory({ onNavigateToChat }: UserHistoryProps = {}) {
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
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
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
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800'
      case 'attention_needed':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'border-green-500'
      case 'attention_needed':
        return 'border-yellow-500'
      case 'critical':
        return 'border-red-500'
      default:
        return 'border-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return '✓'
      case 'attention_needed':
        return '⚠'
      case 'critical':
        return '✕'
      default:
        return '•'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal':
        return 'NORMAL'
      case 'attention_needed':
        return 'WARNING'
      case 'critical':
        return 'CRITICAL'
      default:
        return status.toUpperCase()
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

      // Remove from local state
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

      // Update local state
      setDiagnostics(prev => prev.map(d =>
        d.id === id ? { ...d, userNotes: editedNotes } : d
      ))

      // Update selected record if it's the one being edited
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

  // Extract state and city from address
  const extractRegionFromAddress = (address: string | null | undefined): { state: string | null; city: string | null } => {
    if (!address) return { state: null, city: null }

    // Common address patterns:
    // "123 Main St, City, ST 12345"
    // "123 Main St, City, State 12345"
    // "City, ST"
    // "City, State"

    const parts = address.split(',').map(p => p.trim())

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1]
      const secondToLastPart = parts[parts.length - 2]

      // Try to extract state (2-letter abbreviation or full name before zip)
      const stateMatch = lastPart.match(/([A-Z]{2})\s*\d{5}/) || lastPart.match(/^([A-Z]{2})$/)
      const stateFullMatch = lastPart.match(/^([A-Za-z\s]+)\s*\d{5}/)

      let state = null
      if (stateMatch) {
        state = stateMatch[1]
      } else if (stateFullMatch) {
        state = stateFullMatch[1].trim()
      } else if (lastPart.length <= 20 && !lastPart.match(/\d/)) {
        // Last part might be state name without zip
        state = lastPart
      }

      // City is typically the second to last part
      const city = secondToLastPart && secondToLastPart.length < 50 ? secondToLastPart : parts[0]

      return { state, city }
    }

    return { state: null, city: null }
  }

  // Get unique regions for filter
  const getUniqueRegions = () => {
    const regions = new Set<string>()

    diagnostics.forEach(d => {
      const { state, city } = extractRegionFromAddress(d.locationAddress)
      if (state) {
        regions.add(`${state}`)
      }
      if (city && state) {
        regions.add(`${city}, ${state}`)
      }
    })

    return Array.from(regions).sort()
  }

  const uniqueRegions = getUniqueRegions()

  // Filter and sort diagnostics
  const filteredDiagnostics = diagnostics
    .filter(d => {
      // Status filter
      if (statusFilter !== 'all' && d.result.system_status !== statusFilter) return false

      // System type filter
      if (systemTypeFilter !== 'all' && d.systemType !== systemTypeFilter) return false

      // Region filter
      if (regionFilter !== 'all') {
        const { state, city } = extractRegionFromAddress(d.locationAddress)
        const fullRegion = city && state ? `${city}, ${state}` : state

        // Check if filter matches state or city+state combination
        const matchesState = state === regionFilter
        const matchesFullRegion = fullRegion === regionFilter

        if (!matchesState && !matchesFullRegion) return false
      }

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const diagDate = new Date(d.createdAt)
        const now = new Date()

        if (dateRangeFilter === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          if (diagDate < today) return false
        } else if (dateRangeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (diagDate < weekAgo) return false
        } else if (dateRangeFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (diagDate < monthAgo) return false
        } else if (dateRangeFilter === 'custom') {
          if (customStartDate) {
            const start = new Date(customStartDate)
            if (diagDate < start) return false
          }
          if (customEndDate) {
            const end = new Date(customEndDate)
            end.setHours(23, 59, 59, 999) // End of day
            if (diagDate > end) return false
          }
        }
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          d.systemType.toLowerCase().includes(search) ||
          d.result.summary.toLowerCase().includes(search) ||
          (d.userNotes && d.userNotes.toLowerCase().includes(search)) ||
          d.modelId.toLowerCase().includes(search)
        )
      }

      return true
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime
    })

  // Get unique system types for filter
  const uniqueSystemTypes = [...new Set(diagnostics.map(d => d.systemType))]

  // Calculate stats
  const totalCount = filteredDiagnostics.length
  const normalCount = filteredDiagnostics.filter(d => d.result.system_status === 'normal').length
  const warningCount = filteredDiagnostics.filter(d => d.result.system_status === 'attention_needed').length
  const criticalCount = filteredDiagnostics.filter(d => d.result.system_status === 'critical').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your diagnostic history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto p-6 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-200">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6" style={{ backgroundColor: '#111827' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Diagnostic History
          </h1>
          <p className="text-gray-300">
            View and manage your diagnostic reports
          </p>
        </motion.div>

        {/* Enhanced Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6 overflow-hidden rounded-xl border-2 border-blue-500/50 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
          }}
        >
          {/* Animated gradient background */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              animation: 'pulse 3s ease-in-out infinite'
            }}
          />

          <div className="relative flex items-center p-6">
            {/* Left side - Icon and count */}
            <div className="flex items-center gap-4 flex-1">
              {/* Icon with gradient background */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                }}
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div>
                <div className="text-5xl font-bold text-white mb-1">{totalCount}</div>
                <div className="text-blue-200 text-lg font-medium">Diagnostics Found</div>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="w-px h-16 bg-blue-300/30 mx-6" />

            {/* Right side - Status breakdown */}
            <div className="flex gap-6">
              {normalCount > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300 mb-1">{normalCount}</div>
                  <div className="text-green-200 text-sm font-medium">NORMAL</div>
                </div>
              )}
              {warningCount > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300 mb-1">{warningCount}</div>
                  <div className="text-yellow-200 text-sm font-medium">WARNINGS</div>
                </div>
              )}
              {criticalCount > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-300 mb-1">{criticalCount}</div>
                  <div className="text-red-200 text-sm font-medium">CRITICAL</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search diagnostics..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="normal">Normal</option>
                <option value="attention_needed">Attention Needed</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* System Type Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                System Type
              </label>
              <select
                value={systemTypeFilter}
                onChange={(e) => setSystemTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Systems</option>
                {uniqueSystemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Region (State/City)
              </label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Regions</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Date Range
              </label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {dateRangeFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || systemTypeFilter !== 'all' || regionFilter !== 'all' || dateRangeFilter !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setSystemTypeFilter('all')
                  setRegionFilter('all')
                  setDateRangeFilter('all')
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                className="text-sm text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Diagnostics List */}
        {filteredDiagnostics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 p-12 text-center"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-black mb-2">
              No diagnostics found
            </h3>
            <p className="text-gray-800 mb-4">
              {searchTerm || statusFilter !== 'all' || systemTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You haven't run any diagnostics yet"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiagnostics.map((record, index) => {
              const isStarred = starred.has(record.id)
              const statusBorderColor = getStatusBorderColor(record.result.system_status)

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border-2 ${statusBorderColor} hover:shadow-2xl transition-all duration-300 overflow-hidden ${isStarred ? 'ring-4 ring-yellow-400/50' : ''}`}
                  style={isStarred ? {
                    boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)'
                  } : {}}
                >
                  {/* Star/Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(record.id)
                    }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <svg
                      className={`w-5 h-5 transition-colors ${isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
                      fill={isStarred ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Status Badge - Top Left */}
                  <div className="px-4 pt-4 pb-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(record.result.system_status)}`}>
                      <span className="text-base">{getStatusIcon(record.result.system_status)}</span>
                      {getStatusLabel(record.result.system_status)}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className="px-4 pb-4 cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    {/* System Type - Large Heading */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {record.systemType}
                    </h3>

                    {/* Refrigerant Info */}
                    {record.refrigerant && (
                      <p className="text-sm text-gray-700 mb-2 font-medium">
                        Refrigerant: <span className="text-blue-600">{record.refrigerant}</span>
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {record.result.summary}
                    </p>

                    {/* Issues Badge and Model */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {record.result.faults.length} issue{record.result.faults.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-500 truncate ml-2">
                        {record.modelId.split('/').pop()}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 mb-4">
                      {formatDate(record.createdAt)}
                    </p>

                    {/* Button Layout - EXACT MOCKUP MATCH */}
                    <div className="space-y-2">
                      {/* Row 1: Print and Edit Notes */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            printDiagnostic(record)
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditNotes(record)
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Edit Notes
                        </button>
                      </div>

                      {/* Row 2: Ask AI (Purple Gradient, Full Width) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setChatDiagnostic(record)
                          setChatModalOpen(true)
                        }}
                        className="w-full px-4 py-2 text-white rounded-lg transition-all duration-300 text-sm font-medium hover:shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                        }}
                      >
                        Ask AI About This Diagnostic
                      </button>

                      {/* Row 3: Delete (Full Width) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm(record.id)
                        }}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
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
              className="bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 max-w-lg w-full p-6"
            >
              <h3 className="text-xl font-bold text-black mb-4">
                Edit Technician Notes
              </h3>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 resize-none mb-4"
                placeholder="Add your notes here..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateNotes(editingNotes)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingNotes(null)
                    setEditedNotes('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Delete Diagnostic?
                  </h3>
                  <p className="text-sm text-gray-800">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
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

      {/* Add CSS animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
