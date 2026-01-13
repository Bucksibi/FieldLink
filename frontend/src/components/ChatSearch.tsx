import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchFilters, SearchResult } from '../types/chat'
import { searchConversations, saveRecentSearch, getRecentSearches, clearRecentSearches } from '../utils/chatStorage'

interface ChatSearchProps {
  onSelectResult: (conversationId: string, messageId: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function ChatSearch({ onSelectResult, isOpen, onClose }: ChatSearchProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    messageType: 'all',
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)

    searchTimeoutRef.current = setTimeout(() => {
      const searchResults = searchConversations({
        ...filters,
        query: query.trim(),
      })
      setResults(searchResults)
      setIsSearching(false)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, filters])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim())
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result.conversationId, result.messageId)
    onClose()
  }

  const handleRecentSearch = (search: string) => {
    setQuery(search)
  }

  const handleClearRecent = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Search Modal */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-24 left-1/2 transform -translate-x-1/2 w-full max-w-3xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Search Input */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 bg-transparent text-white text-lg outline-none placeholder-slate-500"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-slate-700 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Message Type</label>
                      <select
                        value={filters.messageType}
                        onChange={(e) => setFilters({ ...filters, messageType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 outline-none"
                      >
                        <option value="all">All Messages</option>
                        <option value="user">My Messages Only</option>
                        <option value="assistant">AI Responses Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">System Type</label>
                      <select
                        value={filters.systemType || ''}
                        onChange={(e) => setFilters({ ...filters, systemType: e.target.value || undefined })}
                        className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 outline-none"
                      >
                        <option value="">All Systems</option>
                        <option value="Gas Split AC System">Gas Split AC</option>
                        <option value="Heat Pump Split">Heat Pump</option>
                        <option value="Gas Pack">Gas Pack</option>
                        <option value="Straight AC Pack">Straight AC</option>
                        <option value="Dual Fuel">Dual Fuel</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Date From</label>
                      <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                        className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Date To</label>
                      <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                        className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.starred || false}
                        onChange={(e) => setFilters({ ...filters, starred: e.target.checked ? true : undefined })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      Starred Only
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.trim().length < 2 ? (
              <div className="p-6">
                {recentSearches.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-400">Recent Searches</h3>
                      <button
                        onClick={handleClearRecent}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearch(search)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg flex items-center gap-3 transition-colors"
                        >
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {search}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Type to search conversations...</p>
                  </div>
                )}
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {results.map((result, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-6 py-4 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-200">{result.conversationTitle}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        result.messageRole === 'user'
                          ? 'bg-purple-900/30 text-purple-400'
                          : 'bg-green-900/30 text-green-400'
                      }`}>
                        {result.messageRole === 'user' ? 'You' : 'Sensei'}
                      </span>
                      {result.systemType && (
                        <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                          {result.systemType}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm text-slate-400 line-clamp-2 mb-2"
                      dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                    />
                    <span className="text-xs text-slate-600">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500 text-sm">No results found</p>
                <p className="text-slate-600 text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-700 text-xs text-slate-500 flex items-center justify-between">
              <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
              <span className="text-slate-600">Press ESC to close</span>
            </div>
          )}
        </div>
      </motion.div>

      <style>{`
        mark {
          background: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
      `}</style>
    </>
  )
}
