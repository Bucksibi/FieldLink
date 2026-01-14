import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  images?: string[]
}

interface DiagnosticRecord {
  id: string
  locationAddress?: string | null
  systemType: string
  refrigerant: string | null
  readings: Record<string, number>
  userNotes: string | null
  result: any
  createdAt: string
}

// Suggestion prompts for HVAC technicians
const SUGGESTIONS = [
  { text: 'What causes low superheat?', icon: 'temp' },
  { text: 'Diagnose compressor failure', icon: 'gear' },
  { text: 'R-410A pressure readings', icon: 'gauge' },
  { text: 'Troubleshoot short cycling', icon: 'bolt' },
]

interface AIChatPageEnhancedProps {
  initialMessages?: any[]
  initialDiagnosticContext?: any
  onMount?: () => void
}

export default function AIChatPageEnhanced({ initialMessages, initialDiagnosticContext, onMount }: AIChatPageEnhancedProps = {}) {
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([])
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<string | null>(null)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Typewriter effect state
  const [targetContent, setTargetContent] = useState<string>('')
  const [displayedContent, setDisplayedContent] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialize
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      const convertedMessages: Message[] = initialMessages.map((msg) => ({
        id: msg.id || crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      }))
      setMessages(convertedMessages)
      if (initialDiagnosticContext?.result?.id) {
        setSelectedDiagnostic(initialDiagnosticContext.result.id)
      }
      if (onMount) onMount()
    }
  }, [initialMessages, initialDiagnosticContext, onMount])

  // Load diagnostics
  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const response = await fetch('/api/diagnostics/history', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setDiagnostics(data.diagnostics)
        }
      } catch (err) {
        console.error('Failed to load diagnostics:', err)
      }
    }
    fetchDiagnostics()
  }, [token])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayedContent])

  // Typewriter effect - types characters fast
  useEffect(() => {
    if (!isTyping || !typingMessageId) return

    if (displayedContent.length < targetContent.length) {
      const timeout = setTimeout(() => {
        // Type multiple characters at once for speed (2-4 chars per tick)
        const charsToAdd = Math.min(3, targetContent.length - displayedContent.length)
        setDisplayedContent(targetContent.slice(0, displayedContent.length + charsToAdd))
      }, 8) // Very fast typing speed

      return () => clearTimeout(timeout)
    }
  }, [isTyping, targetContent, displayedContent, typingMessageId])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, assistantMessage])
    setTypingMessageId(assistantMessageId)
    setTargetContent('')
    setDisplayedContent('')
    setIsTyping(true)

    try {
      const selectedDiagnosticData = selectedDiagnostic
        ? diagnostics.find(d => d.id === selectedDiagnostic)
        : null

      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          diagnosticContext: selectedDiagnosticData,
          userRole: user?.role,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response stream')

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]' || !data) continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) throw new Error(parsed.error)
              if (parsed.content) {
                accumulatedContent += parsed.content
                // Update target content for typewriter effect
                setTargetContent(accumulatedContent)
              }
            } catch (e) {
              continue
            }
          }
        }
      }

      // Wait for typewriter to finish, then update final message
      const finalContent = accumulatedContent
      const waitForTyping = setInterval(() => {
        setDisplayedContent(prev => {
          if (prev.length >= finalContent.length) {
            clearInterval(waitForTyping)
            setMessages(prevMsgs =>
              prevMsgs.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: finalContent }
                  : msg
              )
            )
            setIsTyping(false)
            setTypingMessageId(null)
            setLoading(false)
            return prev
          }
          return prev
        })
      }, 50)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
      setLoading(false)
      setTypingMessageId(null)
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopySuccess('Copied!')
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([])
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#0a0a0f' }}>
      {/* Google Fonts - Industrial Typography */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600&family=Rajdhani:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Fixed Background Effects Container */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* Animated Blueprint Grid Background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full">
            <defs>
              <pattern id="controlGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f5a623" strokeWidth="0.5" />
              </pattern>
              <pattern id="controlGridLarge" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#f5a623" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#controlGrid)" />
            <rect width="100%" height="100%" fill="url(#controlGridLarge)" />
          </svg>
        </div>

        {/* Scan Line Effect */}
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245, 166, 35, 0.01) 2px, rgba(245, 166, 35, 0.01) 4px)',
          }}
        />

        {/* Corner Technical Decorations */}
        <div className="absolute top-0 left-0 w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
            <path d="M 0 30 L 30 30 L 30 0" fill="none" stroke="#f5a623" strokeWidth="2" />
            <circle cx="30" cy="30" r="4" fill="#f5a623" />
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
            <path d="M 100 30 L 70 30 L 70 0" fill="none" stroke="#f5a623" strokeWidth="2" />
            <circle cx="70" cy="30" r="4" fill="#f5a623" />
          </svg>
        </div>

        {/* Bottom Corner Glows */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64"
          style={{
            background: 'radial-gradient(circle at bottom left, rgba(245, 166, 35, 0.1) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64"
          style={{
            background: 'radial-gradient(circle at bottom right, rgba(74, 144, 217, 0.1) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-screen pt-20">
        {/* Control Room Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="px-6 py-4"
        >
          <div className="max-w-4xl mx-auto">
            {/* Status Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Pulsing Status Indicator */}
                <div className="relative">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: '#10b981' }}
                  />
                  <div
                    className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
                    style={{ background: '#10b981', opacity: 0.5 }}
                  />
                </div>
                <span
                  className="text-xs tracking-[0.3em] uppercase"
                  style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#10b981' }}
                >
                  SYSTEM ONLINE
                </span>
              </div>

              {/* Right side - Diagnostic Selector & Time */}
              <div className="flex items-center gap-3">
                {/* Compact Diagnostic Selector */}
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: selectedDiagnostic ? '1px solid rgba(245, 166, 35, 0.3)' : '1px solid #2a2a2a',
                  }}
                >
                  {selectedDiagnostic && (
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#f5a623' }} />
                  )}
                  <select
                    value={selectedDiagnostic || ''}
                    onChange={(e) => setSelectedDiagnostic(e.target.value || null)}
                    className="bg-transparent cursor-pointer outline-none max-w-[200px]"
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '11px',
                      color: selectedDiagnostic ? '#f5a623' : '#707070',
                    }}
                  >
                    <option value="">General Mode</option>
                    {diagnostics.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.systemType} - {new Date(d.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <span
                  className="text-xs"
                  style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#707070' }}
                >
                  {new Date().toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
            </div>

            {/* Main Title */}
            <div className="flex items-center gap-4">
              {/* Animated Gauge Icon */}
              <motion.div
                className="relative w-16 h-16"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#1c1c1c" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#f5a623" strokeWidth="4" strokeDasharray="120 60" strokeLinecap="round" />
                  <line x1="32" y1="32" x2="32" y2="14" stroke="#f5a623" strokeWidth="3" strokeLinecap="round">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 32 32"
                      to="360 32 32"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </line>
                  <circle cx="32" cy="32" r="4" fill="#f5a623" />
                </svg>
              </motion.div>

              <div>
                <h1
                  className="text-4xl tracking-wide"
                  style={{ fontFamily: '"Bebas Neue", sans-serif', color: '#f5a623', letterSpacing: '0.05em' }}
                >
                  SENSEI TERMINAL
                </h1>
                <p
                  className="text-sm tracking-wider"
                  style={{ fontFamily: '"Rajdhani", sans-serif', color: '#707070' }}
                >
                  HVAC DIAGNOSTIC AI INTERFACE
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Empty State - Fixed in center when no messages */}
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-6 py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              {/* Large Terminal Icon */}
              <motion.div
                className="relative w-32 h-32 mx-auto mb-8"
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(245, 166, 35, 0.2)',
                    '0 0 60px rgba(245, 166, 35, 0.4)',
                    '0 0 30px rgba(245, 166, 35, 0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div
                  className="w-full h-full rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.15) 0%, rgba(245, 166, 35, 0.05) 100%)',
                    border: '2px solid rgba(245, 166, 35, 0.3)',
                  }}
                >
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M8 8l4 4-4 4" />
                    <line x1="14" y1="16" x2="18" y2="16" />
                  </svg>
                </div>
              </motion.div>

              <h2
                className="text-3xl mb-2"
                style={{ fontFamily: '"Bebas Neue", sans-serif', color: '#f5a623', letterSpacing: '0.1em' }}
              >
                TERMINAL READY
              </h2>
              <p
                className="text-sm mb-10"
                style={{ fontFamily: '"Rajdhani", sans-serif', color: '#707070' }}
              >
                Ask questions about HVAC systems, diagnostics, or troubleshooting
              </p>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                {SUGGESTIONS.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInput(suggestion.text)}
                    className="group p-4 text-left rounded-lg transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(28, 28, 28, 0.6) 0%, rgba(10, 10, 15, 0.8) 100%)',
                      border: '1px solid #2a2a2a',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{
                          background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.1) 100%)',
                          border: '1px solid rgba(245, 166, 35, 0.3)',
                        }}
                      >
                        {suggestion.icon === 'temp' && (
                          <svg className="w-5 h-5" fill="none" stroke="#f5a623" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
                          </svg>
                        )}
                        {suggestion.icon === 'gear' && (
                          <svg className="w-5 h-5" fill="none" stroke="#f5a623" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                        {suggestion.icon === 'gauge' && (
                          <svg className="w-5 h-5" fill="none" stroke="#f5a623" viewBox="0 0 24 24" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                        )}
                        {suggestion.icon === 'bolt' && (
                          <svg className="w-5 h-5" fill="none" stroke="#f5a623" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-sm font-medium group-hover:text-[#f5a623] transition-colors"
                        style={{ fontFamily: '"Rajdhani", sans-serif', color: '#d4d4d4' }}
                      >
                        {suggestion.text}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Messages Area - Only shown when there are messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}
                  >
                    {message.role === 'user' ? (
                      // User Message - Right aligned bubble
                      <div
                        className="max-w-[75%] px-5 py-3 rounded-2xl rounded-tr-sm"
                        style={{
                          background: 'linear-gradient(135deg, #f5a623 0%, #d4891a 100%)',
                          boxShadow: '0 4px 20px rgba(245, 166, 35, 0.3)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs opacity-80"
                            style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#0a0a0f' }}
                          >
                            YOU
                          </span>
                          <span
                            className="text-xs opacity-60"
                            style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#0a0a0f' }}
                          >
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p
                          className="whitespace-pre-wrap"
                          style={{ fontFamily: '"Rajdhani", sans-serif', color: '#0a0a0f', fontWeight: 500 }}
                        >
                          {message.content}
                        </p>
                      </div>
                    ) : (
                      // AI Message - Left aligned, no bubble
                      <div className="max-w-[85%] group relative">
                        <div className="flex items-center gap-3 mb-2">
                          {/* AI Avatar */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.2) 0%, rgba(74, 144, 217, 0.1) 100%)',
                              border: '1px solid rgba(74, 144, 217, 0.3)',
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="#4a90d9" viewBox="0 0 24 24" strokeWidth={2}>
                              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <span
                            className="text-xs tracking-wider uppercase"
                            style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#4a90d9' }}
                          >
                            SENSEI AI
                          </span>
                          <span
                            className="text-xs"
                            style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#707070' }}
                          >
                            {formatTime(message.timestamp)}
                          </span>
                        </div>

                        <div
                          className="pl-11 whitespace-pre-wrap"
                          style={{ fontFamily: '"Rajdhani", sans-serif', color: '#7dd3fc', fontSize: '15px', lineHeight: 1.7 }}
                        >
                          {/* Show typewriter content for active message, otherwise show stored content */}
                          {typingMessageId === message.id ? displayedContent : message.content}
                          {typingMessageId === message.id && (
                            <span
                              className="inline-block w-2 h-4 ml-1 animate-pulse"
                              style={{ background: '#7dd3fc' }}
                            />
                          )}
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{
                              background: 'rgba(28, 28, 28, 0.9)',
                              border: '1px solid #2a2a2a',
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="#707070" viewBox="0 0 24 24" strokeWidth={2}>
                              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading State */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mb-6"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.2) 0%, rgba(74, 144, 217, 0.1) 100%)',
                    border: '1px solid rgba(74, 144, 217, 0.3)',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="#4a90d9" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="#4a90d9" />
                    </svg>
                  </motion.div>
                </div>
                <span
                  className="text-sm animate-pulse"
                  style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#4a90d9' }}
                >
                  PROCESSING...
                </span>
              </motion.div>
            )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Copy Success Toast */}
        <AnimatePresence>
          {copySuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '12px',
                color: '#fff',
              }}
            >
              {copySuccess}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderTop: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="max-w-4xl mx-auto">
              <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '13px', color: '#ef4444' }}>
                ERROR: {error}
              </p>
            </div>
          </div>
        )}

        {/* Input Area - Industrial Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 py-4"
          style={{
            background: 'linear-gradient(0deg, #0a0a0f 0%, rgba(10, 10, 15, 0.95) 100%)',
            borderTop: '1px solid #2a2a2a',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div
              className="p-4 rounded-xl relative"
              style={{
                background: 'linear-gradient(135deg, rgba(28, 28, 28, 0.8) 0%, rgba(10, 10, 15, 0.9) 100%)',
                border: '1px solid #2a2a2a',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              {/* Panel Rivets */}
              <div className="absolute top-3 left-3 w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #3a3a3a, #1a1a1a)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }} />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #3a3a3a, #1a1a1a)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }} />

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ENTER QUERY..."
                    rows={1}
                    className="w-full px-4 py-3 rounded-lg outline-none resize-none transition-all duration-200"
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '14px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid #2a2a2a',
                      color: '#d4d4d4',
                      minHeight: '48px',
                      maxHeight: '150px',
                    }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200"
                  style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '16px',
                    letterSpacing: '0.1em',
                    background: !input.trim() || loading
                      ? 'rgba(245, 166, 35, 0.3)'
                      : 'linear-gradient(135deg, #f5a623 0%, #d4891a 100%)',
                    color: '#0a0a0f',
                    boxShadow: !input.trim() || loading ? 'none' : '0 4px 20px rgba(245, 166, 35, 0.4)',
                    cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                    opacity: !input.trim() || loading ? 0.5 : 1,
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  TRANSMIT
                </motion.button>

                {messages.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearChat}
                    className="px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                    style={{
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: '14px',
                      letterSpacing: '0.1em',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                    }}
                  >
                    CLEAR
                  </motion.button>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p
                  className="text-xs"
                  style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#707070' }}
                >
                  ENTER TO SEND / SHIFT+ENTER FOR NEW LINE
                </p>
                {input.length > 0 && (
                  <span
                    className="text-xs tabular-nums"
                    style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#707070' }}
                  >
                    {input.length}/2000
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
