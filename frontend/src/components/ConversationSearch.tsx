import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ConversationSearchProps {
  messages: Message[]
  isOpen: boolean
  onClose: () => void
  onNavigate: (messageId: string) => void
}

export default function ConversationSearch({
  messages,
  isOpen,
  onClose,
  onNavigate
}: ConversationSearchProps) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matches, setMatches] = useState<{ messageId: string; index: number }[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setMatches([])
      setCurrentIndex(0)
      return
    }

    const lowerQuery = query.toLowerCase()
    const matchingMessages = messages
      .map((msg, index) => ({
        messageId: msg.id,
        index,
        matches: msg.content.toLowerCase().includes(lowerQuery)
      }))
      .filter(item => item.matches)
      .map(item => ({ messageId: item.messageId, index: item.index }))

    setMatches(matchingMessages)
    setCurrentIndex(0)

    // Scroll to first match
    if (matchingMessages.length > 0) {
      onNavigate(matchingMessages[0].messageId)
    }
  }, [query, messages, onNavigate])

  const goToNext = () => {
    if (matches.length === 0) return
    const nextIndex = (currentIndex + 1) % matches.length
    setCurrentIndex(nextIndex)
    onNavigate(matches[nextIndex].messageId)
  }

  const goToPrevious = () => {
    if (matches.length === 0) return
    const prevIndex = currentIndex === 0 ? matches.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    onNavigate(matches[prevIndex].messageId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        goToPrevious()
      } else {
        goToNext()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-20 right-8 z-50 rounded-lg shadow-2xl border border-slate-600 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          minWidth: '320px'
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search in conversation..."
                className="w-full pl-10 pr-3 py-2 bg-slate-700/50 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-all text-slate-400 hover:text-white"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {query && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                {matches.length > 0 ? (
                  <span className="text-slate-300">
                    {currentIndex + 1} of {matches.length}
                  </span>
                ) : (
                  <span className="text-slate-400">No matches</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevious}
                  disabled={matches.length === 0}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-all text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous (Shift+Enter)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  disabled={matches.length === 0}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-all text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next (Enter)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 text-xs text-slate-400">
            Press Enter for next, Shift+Enter for previous
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
