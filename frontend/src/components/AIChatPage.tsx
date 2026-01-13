import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import ChatSidebar from './ChatSidebar'
import ChatSearch from './ChatSearch'
import ConversationSearch from './ConversationSearch'
import { ChatConversation } from '../types/chat'
import {
  initializeStorage,
  getCurrentConversation,
  setCurrentConversation as setStorageCurrentConversation,
  getConversation,
  createConversation,
  saveConversation,
  generateConversationTitle,
} from '../utils/chatStorage'
import { exportAsText, exportAsMarkdown, exportAsHTML } from '../utils/exportConversation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  images?: string[] // Base64 data URLs for attached images
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

// All available suggestion prompts
const ALL_SUGGESTIONS = [
  'What causes low superheat in an AC system?',
  'How do I diagnose a compressor failure?',
  'What are normal operating pressures for R-410A?',
  'How do I check a reversing valve on a heat pump?',
  'What are the signs of a refrigerant leak?',
  'How do I troubleshoot a faulty thermostat?',
  'What causes high subcooling in cooling mode?',
  'How do I test a capacitor on a condenser unit?',
  'What are common causes of short cycling?',
  'How do I diagnose a blower motor issue?',
  'What should I check if the system won\'t heat?',
  'How do I measure airflow in CFM?',
  'What causes frozen evaporator coils?',
  'How do I check if a TXV is stuck?',
  'What are the symptoms of a failing contactor?',
  'How do I diagnose low airflow issues?',
]

interface AIChatPageProps {
  initialMessages?: any[]
  initialDiagnosticContext?: any
  onMount?: () => void
}

export default function AIChatPage({ initialMessages, initialDiagnosticContext, onMount }: AIChatPageProps = {}) {
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([])
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<string | null>(null)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  // Chat organization state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [conversationSearchOpen, setConversationSearchOpen] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize storage and load current conversation
  useEffect(() => {
    initializeStorage()

    // If initial messages are provided, convert and load them
    if (initialMessages && initialMessages.length > 0) {
      console.log('Loading transferred messages:', initialMessages)

      // Convert modal messages to AIChatPage format
      const convertedMessages: Message[] = initialMessages.map((msg, index) => ({
        id: msg.id || crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      }))

      setMessages(convertedMessages)

      // If diagnostic context provided, try to match it to a diagnostic
      if (initialDiagnosticContext?.result?.id) {
        setSelectedDiagnostic(initialDiagnosticContext.result.id)
      }

      // Clear the transfer data
      if (onMount) {
        onMount()
      }

      return
    }

    const currentId = getCurrentConversation()
    if (currentId) {
      const conv = getConversation(currentId)
      if (conv) {
        setCurrentConversation(conv)
        setMessages(conv.messages)
        if (conv.diagnosticId) {
          setSelectedDiagnostic(conv.diagnosticId)
        }
      }
    }
  }, [initialMessages, initialDiagnosticContext, onMount])

  // Randomly select 4 suggestions on component mount
  useEffect(() => {
    const shuffled = [...ALL_SUGGESTIONS].sort(() => Math.random() - 0.5)
    setSuggestions(shuffled.slice(0, 4))
  }, [])

  // Conversation management handlers
  const handleNewConversation = () => {
    const newConv = createConversation()
    setCurrentConversation(newConv)
    setStorageCurrentConversation(newConv.id)
    setMessages([])
    setSelectedDiagnostic('')
  }

  const handleSelectConversation = (conversationId: string) => {
    const conv = getConversation(conversationId)
    if (conv) {
      setCurrentConversation(conv)
      setStorageCurrentConversation(conversationId)
      setMessages(conv.messages)
      if (conv.diagnosticId) {
        setSelectedDiagnostic(conv.diagnosticId)
      } else {
        setSelectedDiagnostic('')
      }
    }
  }

  const handleSearchResult = (conversationId: string) => {
    handleSelectConversation(conversationId)
    setSearchOpen(false)
  }

  // Auto-save messages to current conversation
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      const updatedConv: ChatConversation = {
        ...currentConversation,
        messages,
        dateModified: new Date().toISOString(),
      }

      // Auto-generate title from first user message if title is default or empty
      if ((!currentConversation.title || currentConversation.title === 'New Conversation') && messages.length > 0) {
        const firstUserMessage = messages.find(m => m.role === 'user')
        if (firstUserMessage) {
          updatedConv.title = generateConversationTitle(firstUserMessage.content)
        }
      }

      setCurrentConversation(updatedConv)
      saveConversation(updatedConv)
    }
  }, [messages])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        // If there are messages in current conversation, open conversation search
        // Otherwise open global search
        if (messages.length > 0) {
          setConversationSearchOpen(true)
        } else {
          setSearchOpen(true)
        }
      }
      // Ctrl+N or Cmd+N: New conversation
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewConversation()
      }
      // ESC: Close search
      if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false)
        if (conversationSearchOpen) setConversationSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, conversationSearchOpen, messages.length])

  // Loading stages progression
  useEffect(() => {
    if (!loading) {
      setLoadingStage(0)
      return
    }

    const interval = setInterval(() => {
      setLoadingStage(prev => (prev + 1) % 3)
    }, 2000) // Change stage every 2 seconds

    return () => clearInterval(interval)
  }, [loading])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()

      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')

        setInput(transcript)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(`Voice recognition error: ${event.error}`)
        }
      }

      recognitionInstance.onend = () => {
        setIsRecording(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  // Load diagnostics
  useEffect(() => {
    fetchDiagnostics()
  }, [token])

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch('/api/diagnostics/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDiagnostics(data.diagnostics)
      }
    } catch (err) {
      console.error('Failed to load diagnostics:', err)
    }
  }

  // Load chat history from localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem('hvac_ai_chat_history')
    const savedDiagnostic = localStorage.getItem('hvac_ai_chat_selected_diagnostic')

    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat)
        setMessages(parsed)
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }

    if (savedDiagnostic) {
      setSelectedDiagnostic(savedDiagnostic)
    }
  }, [])

  // Save chat history and selected diagnostic to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('hvac_ai_chat_history', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    if (selectedDiagnostic) {
      localStorage.setItem('hvac_ai_chat_selected_diagnostic', selectedDiagnostic)
    } else {
      localStorage.removeItem('hvac_ai_chat_selected_diagnostic')
    }
  }, [selectedDiagnostic])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  // Close attach menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showAttachMenu && !(e.target as Element).closest('.attach-menu-container')) {
        setShowAttachMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAttachMenu])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    // Convert attached images to base64
    const imageDataUrls: string[] = []
    for (const file of attachedFiles) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      imageDataUrls.push(base64)
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      images: imageDataUrls.length > 0 ? imageDataUrls : undefined,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAttachedFiles([]) // Clear attached files after sending
    setLoading(true)
    setError(null)

    // Create placeholder assistant message for streaming
    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, assistantMessage])
    setTypingMessageId(assistantMessageId)

    try {
      const selectedDiagnosticData = selectedDiagnostic
        ? diagnostics.find(d => d.id === selectedDiagnostic)
        : null

      // Build messages array with image support
      const apiMessages = [...messages, userMessage].map((m, index) => {
        // For the last message (current user message), include images if any
        if (index === messages.length && imageDataUrls.length > 0) {
          return {
            role: m.role,
            content: [
              {
                type: 'text',
                text: m.content
              },
              ...imageDataUrls.map(imageUrl => ({
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }))
            ]
          }
        }
        // For other messages, just send text content
        return {
          role: m.role,
          content: m.content,
        }
      })

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
          hasImages: imageDataUrls.length > 0,
          enableWebSearch: webSearchEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream')
      }

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              continue
            }

            if (!data) continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.error) {
                throw new Error(parsed.error)
              }

              if (parsed.content) {
                // Accumulate content immediately - no delays
                accumulatedContent += parsed.content

                // Update the assistant message instantly with accumulated content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                )
              }
            } catch (e) {
              // Skip malformed JSON
              continue
            }
          }
        }
      }

      setLoading(false)
      setTypingMessageId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      // Remove the placeholder assistant message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
      setLoading(false)
      setTypingMessageId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = () => {
    if (!recognition) {
      setError('Voice recognition not supported in this browser')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      setError(null)
      setInput('') // Clear input before starting
      recognition.start()
      setIsRecording(true)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles(prev => [...prev, ...files])
    setShowAttachMenu(false)
    e.target.value = '' // Reset input
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
    setShowAttachMenu(false)
  }

  const openCamera = async () => {
    setShowAttachMenu(false)
    setShowCameraModal(true)
    setCapturedPhoto(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      setCameraStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access camera. Please check permissions.')
      setShowCameraModal(false)
    }
  }

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCameraModal(false)
    setCapturedPhoto(null)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedPhoto(imageDataUrl)
      }
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  const usePhoto = () => {
    if (capturedPhoto) {
      // Convert data URL to File
      fetch(capturedPhoto)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
          setAttachedFiles(prev => [...prev, file])
          closeCamera()
        })
    }
  }

  const triggerCameraInput = () => {
    // For mobile devices, use native camera input
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      cameraInputRef.current?.click()
      setShowAttachMenu(false)
    } else {
      // For desktop, open webcam modal
      openCamera()
    }
  }

  const clearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      setMessages([])
      localStorage.removeItem('hvac_ai_chat_history')
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

  const navigateToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add a temporary highlight effect
      messageElement.classList.add('ring-2', 'ring-blue-500', 'rounded-lg')
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-blue-500', 'rounded-lg')
      }, 2000)
    }
  }

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    // Find the user message that came before this AI response
    let userMessageIndex = messageIndex - 1
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--
    }

    if (userMessageIndex < 0) return

    const userMessage = messages[userMessageIndex]

    // Remove all messages from this AI response onward
    const newMessages = messages.slice(0, messageIndex)
    setMessages(newMessages)

    // Set the input to the user message content and trigger send
    setInput(userMessage.content)
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    if (isToday) {
      return `Today ${timeStr}`
    } else {
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      return `${dateStr} ${timeStr}`
    }
  }

  // Icon mapping for suggestions
  const getSuggestionIcon = (suggestion: string) => {
    if (suggestion.includes('airflow') || suggestion.includes('measure')) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold">$</text>
        </svg>
      )
    } else if (suggestion.includes('blower') || suggestion.includes('motor') || suggestion.includes('fan')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    } else if (suggestion.includes('leak') || suggestion.includes('thermostat') || suggestion.includes('test') || suggestion.includes('check')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    } else if (suggestion.includes('cycling') || suggestion.includes('capacitor') || suggestion.includes('contactor') || suggestion.includes('electrical')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  return (
    <div className="fixed inset-0 flex" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentConversationId={currentConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Chat Search Modal */}
      <ChatSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectResult={handleSearchResult}
      />

      <ConversationSearch
        messages={messages}
        isOpen={conversationSearchOpen}
        onClose={() => setConversationSearchOpen(false)}
        onNavigate={navigateToMessage}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'} pt-20`}>
        {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                📷 Take Photo
              </h3>
              <button
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative bg-black aspect-video">
              {!capturedPhoto ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="p-4 flex gap-3 justify-center">
              {!capturedPhoto ? (
                <>
                  <button
                    onClick={capturePhoto}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capture Photo
                  </button>
                  <button
                    onClick={closeCamera}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={usePhoto}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Use Photo
                  </button>
                  <button
                    onClick={retakePhoto}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={closeCamera}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hidden canvas for capturing photo */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Action Bar */}
      <div className="px-8 py-4 border-b border-slate-700/50 flex items-center justify-between backdrop-blur-sm bg-slate-900/30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-blue-500/10 transition-all"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Sensei HVAC Assistant</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-500/10 transition-all flex items-center gap-2"
            title="Search conversations (Ctrl+F)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>

          {/* Export Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-500/10 transition-all flex items-center gap-2"
              title="Export conversation"
              disabled={messages.length === 0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {/* Export Menu Dropdown */}
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl border border-slate-600 overflow-hidden z-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <button
                    onClick={() => {
                      const convToExport: ChatConversation = currentConversation || {
                        id: crypto.randomUUID(),
                        title: 'Sensei Chat Export',
                        messages,
                        systemType: null,
                        diagnosticId: selectedDiagnostic,
                        dateCreated: new Date().toISOString(),
                        dateModified: new Date().toISOString(),
                        folderId: '',
                        starred: false,
                        tags: [],
                        archived: false
                      }
                      exportAsText(convToExport)
                      setShowExportMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-blue-500/20 transition-all flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as Text
                  </button>
                  <button
                    onClick={() => {
                      const convToExport: ChatConversation = currentConversation || {
                        id: crypto.randomUUID(),
                        title: 'Sensei Chat Export',
                        messages,
                        systemType: null,
                        diagnosticId: selectedDiagnostic,
                        dateCreated: new Date().toISOString(),
                        dateModified: new Date().toISOString(),
                        folderId: '',
                        starred: false,
                        tags: [],
                        archived: false
                      }
                      exportAsMarkdown(convToExport)
                      setShowExportMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-blue-500/20 transition-all flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => {
                      const convToExport: ChatConversation = currentConversation || {
                        id: crypto.randomUUID(),
                        title: 'Sensei Chat Export',
                        messages,
                        systemType: null,
                        diagnosticId: selectedDiagnostic,
                        dateCreated: new Date().toISOString(),
                        dateModified: new Date().toISOString(),
                        folderId: '',
                        starred: false,
                        tags: [],
                        archived: false
                      }
                      exportAsHTML(convToExport)
                      setShowExportMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-blue-500/20 transition-all flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Export as HTML
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleNewConversation}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
            title="New conversation (Ctrl+N)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
      </div>

      {/* Diagnostic Banner */}
      <div className="mx-8 my-4 p-4 rounded-2xl backdrop-blur-lg flex items-center gap-4" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
      }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        }}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-400 mb-1">Analyze Diagnostic:</div>
          <select
            value={selectedDiagnostic || ''}
            onChange={(e) => setSelectedDiagnostic(e.target.value || null)}
            className="w-full px-4 py-2 rounded-lg text-white text-sm cursor-pointer border-0 outline-none"
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            <option value="">General HVAC Questions (No specific diagnostic)</option>
            {diagnostics.map((d) => {
              const date = new Date(d.createdAt).toLocaleDateString()
              return (
                <option key={d.id} value={d.id}>
                  {d.locationAddress || 'No address'} - {d.systemType} ({date})
                </option>
              )
            })}
          </select>
        </div>
        {selectedDiagnostic && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm" style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa'
          }}>
            <div className="w-2 h-2 bg-green-500 rounded-full" style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}></div>
            <span>{diagnostics.find(d => d.id === selectedDiagnostic)?.systemType}</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              {/* Large Chat Icon with Glow and Float Animation */}
              <motion.div
                className="relative inline-block mb-8"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="absolute inset-0 rounded-full blur-3xl" style={{
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                  animation: 'pulse 3s ease-in-out infinite'
                }}></div>
                <div className="relative w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                  boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg className="w-12 h-12" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    <circle cx="9" cy="10" r="1" fill="#3b82f6"/>
                    <circle cx="12" cy="10" r="1" fill="#3b82f6"/>
                    <circle cx="15" cy="10" r="1" fill="#3b82f6"/>
                  </svg>
                </div>
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-3">
                Start a conversation
              </h2>
              <p className="text-slate-400 text-lg mb-10">
                Ask questions about HVAC diagnostics, troubleshooting, or technical specifications
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {suggestions.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setInput(suggestion)}
                    className="group p-5 text-left bg-slate-800/50 backdrop-blur-sm rounded-2xl border-2 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all duration-300 flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {getSuggestionIcon(suggestion)}
                    </div>
                    <span className="text-white text-base font-medium pt-2.5">
                      {suggestion}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  id={`message-${message.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    // User messages keep bubble style
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-blue-600 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs opacity-75">You</span>
                        <span className="text-xs opacity-50">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      {message.images && message.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {message.images.map((img, imgIndex) => (
                            <div key={imgIndex} className="rounded-lg overflow-hidden border-2 border-blue-400/50">
                              <img
                                src={img}
                                alt={`Attachment ${imgIndex + 1}`}
                                className="max-w-[200px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(img, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    // Sensei messages without bubble
                    <div className="max-w-[80%] py-2 group relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-400">
                          Sensei
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap break-words text-white">
                        {message.content}
                        {typingMessageId === message.id && (
                          <span className="inline-block w-2 h-2 ml-1 rounded-full bg-gray-400 animate-pulse"></span>
                        )}
                      </div>

                      {/* Hover Action Buttons */}
                      <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="p-2 rounded-lg bg-slate-700/90 hover:bg-slate-600 text-slate-200 backdrop-blur-sm shadow-lg transition-all hover:scale-110"
                          title="Copy message"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => regenerateResponse(message.id)}
                          className="p-2 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white backdrop-blur-sm shadow-lg transition-all hover:scale-110"
                          title="Regenerate response"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-4"
            >
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl border border-slate-700" style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)',
                backdropFilter: 'blur(10px)'
              }}>
                <motion.div
                  animate={{
                    rotate: [0, -15, 15, -15, 15, 0],
                    scale: [1, 1.1, 1, 1.1, 1, 1]
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
                  className="text-2xl"
                >
                  🥋
                </motion.div>
                <div className="flex flex-col gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={loadingStage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm font-semibold text-white"
                    >
                      {loadingStage === 0 && '🔍 Analyzing your question...'}
                      {loadingStage === 1 && '🧮 Calculating diagnosis...'}
                      {loadingStage === 2 && '✍️ Generating response...'}
                    </motion.span>
                  </AnimatePresence>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((stage) => (
                      <motion.div
                        key={stage}
                        className="w-2 h-2 rounded-full"
                        animate={{
                          backgroundColor: loadingStage === stage ? '#3b82f6' : '#475569',
                          scale: loadingStage === stage ? [1, 1.2, 1] : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Copy Success Toast */}
      <AnimatePresence>
        {copySuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {copySuccess}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-700/50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area - Sticky at bottom */}
      <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          {/* File Preview with Image Thumbnails */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  {file.type.startsWith('image/') ? (
                    <div className="relative rounded-lg overflow-hidden border-2 border-blue-500/50 shadow-lg">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-24 h-24 object-cover"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                        <p className="text-xs text-white truncate">{file.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-blue-200">
                        📄 {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            {/* Attach Button with Dropdown */}
            <div className="relative attach-menu-container">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={loading}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors flex items-center gap-2 border border-slate-700"
                style={{ minHeight: '48px' }}
                title="Attach files or photos"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden z-10">
                  <button
                    onClick={triggerFileInput}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center gap-3 text-slate-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">Choose Files</span>
                  </button>
                  <button
                    onClick={triggerFileInput}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center gap-3 text-slate-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Photo Library</span>
                  </button>
                  <button
                    onClick={triggerCameraInput}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center gap-3 text-slate-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">Take Photo</span>
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <button
              onClick={toggleRecording}
              disabled={loading}
              className={`px-4 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 border ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse border-red-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              style={{ minHeight: '48px' }}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              {isRecording ? 'Recording...' : ''}
            </button>
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`px-4 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 border ${
                webSearchEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              style={{ minHeight: '48px' }}
              title={webSearchEnabled ? 'Web search enabled - AI can look up part numbers and specs' : 'Enable web search for part lookups'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {webSearchEnabled && <span className="text-xs">Web</span>}
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening..." : "Ask me anything about HVAC systems..."}
                rows={1}
                disabled={isRecording}
                className="w-full px-4 py-3 pr-16 border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800/50 text-white placeholder-slate-400 resize-none max-h-40 disabled:opacity-50"
                style={{ minHeight: '48px' }}
              />
              <div className="absolute right-3 bottom-3 text-xs text-slate-500">
                {input.length > 0 && `${input.length}/2000`}
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-500/50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              style={{ minHeight: '48px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                style={{ minHeight: '48px' }}
                title="Clear all messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {isRecording ? '🎤 Speak now... Click the microphone button again to stop' : webSearchEnabled ? '🌐 Web search enabled - AI can look up part numbers and specs online | Press Enter to send' : 'Press Enter to send, Shift+Enter for new line, or use voice input'}
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
