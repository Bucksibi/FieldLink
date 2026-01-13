import { ChatConversation, ChatFolder, SearchFilters, SearchResult } from '../types/chat'

const STORAGE_KEYS = {
  CONVERSATIONS: 'hvac_chat_conversations',
  FOLDERS: 'hvac_chat_folders',
  RECENT_SEARCHES: 'hvac_chat_recent_searches',
  CURRENT_CONVERSATION: 'hvac_chat_current_conversation',
}

// Storage wrapper to use localStorage (window.storage not available in browser)
const storage = {
  get: (key: string): any => {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (e) {
      console.error('Failed to get from localStorage:', e)
      return null
    }
  },
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      // Handle quota exceeded error
      if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError')) {
        console.warn('LocalStorage quota exceeded. Cleaning up old conversations...')
        // Try to clean up old conversations and retry
        cleanupOldConversations()
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError)
          alert('Storage is full. Please delete some old conversations from the Sensei chat.')
        }
      } else {
        console.error('Failed to save to localStorage:', e)
      }
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.error('Failed to remove from localStorage:', e)
    }
  },
}

// Cleanup old conversations to free up space
const cleanupOldConversations = (): void => {
  try {
    const conversations = getAllConversations()

    // Sort by date modified (oldest first)
    const sorted = conversations.sort((a, b) =>
      new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime()
    )

    // Keep only the 20 most recent, delete older ones (unless starred)
    const toDelete = sorted.filter(c => !c.starred).slice(0, Math.max(0, sorted.length - 20))

    toDelete.forEach(conv => {
      deleteConversation(conv.id)
    })

    console.log(`Cleaned up ${toDelete.length} old conversations`)
  } catch (e) {
    console.error('Failed to cleanup conversations:', e)
  }
}

// Initialize storage with empty folders and conversations
export const initializeStorage = (): void => {
  const existingFolders = storage.get(STORAGE_KEYS.FOLDERS)
  if (!existingFolders) {
    // Start with no folders - users create their own
    storage.set(STORAGE_KEYS.FOLDERS, [])
  }

  const existingConversations = storage.get(STORAGE_KEYS.CONVERSATIONS)
  if (!existingConversations) {
    storage.set(STORAGE_KEYS.CONVERSATIONS, [])
  }
}

// Conversation Management
export const getAllConversations = (): ChatConversation[] => {
  return storage.get(STORAGE_KEYS.CONVERSATIONS) || []
}

export const getConversation = (id: string): ChatConversation | null => {
  const conversations = getAllConversations()
  return conversations.find(c => c.id === id) || null
}

export const saveConversation = (conversation: ChatConversation): void => {
  const conversations = getAllConversations()
  const index = conversations.findIndex(c => c.id === conversation.id)

  conversation.dateModified = new Date().toISOString()

  if (index >= 0) {
    conversations[index] = conversation
  } else {
    conversations.push(conversation)
  }

  storage.set(STORAGE_KEYS.CONVERSATIONS, conversations)
}

export const deleteConversation = (id: string): void => {
  let conversations = getAllConversations()
  conversations = conversations.filter(c => c.id !== id)
  storage.set(STORAGE_KEYS.CONVERSATIONS, conversations)

  // Remove from folders
  const folders = getAllFolders()
  folders.forEach(folder => {
    folder.conversationIds = folder.conversationIds.filter(cid => cid !== id)
  })
  storage.set(STORAGE_KEYS.FOLDERS, folders)
}

export const createConversation = (systemType: string | null = null, diagnosticId: string | null = null): ChatConversation => {
  const now = new Date().toISOString()
  const conversation: ChatConversation = {
    id: crypto.randomUUID(),
    title: 'New Conversation',
    messages: [],
    systemType,
    diagnosticId,
    dateCreated: now,
    dateModified: now,
    folderId: '',
    starred: false,
    tags: [],
    archived: false,
  }

  saveConversation(conversation)

  return conversation
}

export const updateConversationTitle = (id: string, title: string): void => {
  const conversation = getConversation(id)
  if (conversation) {
    conversation.title = title
    saveConversation(conversation)
  }
}

export const toggleStarConversation = (id: string): void => {
  const conversation = getConversation(id)
  if (conversation) {
    conversation.starred = !conversation.starred
    saveConversation(conversation)

    // Update starred folder
    if (conversation.starred) {
      addConversationToFolder(id, 'starred')
    } else {
      removeConversationFromFolder(id, 'starred')
    }
  }
}

export const archiveConversation = (id: string): void => {
  const conversation = getConversation(id)
  if (conversation) {
    conversation.archived = true
    conversation.folderId = 'archived'
    saveConversation(conversation)

    // Move to archived folder
    moveConversationToFolder(id, 'archived')
  }
}

// Folder Management
export const getAllFolders = (): ChatFolder[] => {
  return storage.get(STORAGE_KEYS.FOLDERS) || []
}

export const getFolder = (id: string): ChatFolder | null => {
  const folders = getAllFolders()
  return folders.find(f => f.id === id) || null
}

export const createFolder = (name: string, color: string = '#3b82f6', icon: string = 'folder'): ChatFolder => {
  const folders = getAllFolders()
  const maxOrder = Math.max(...folders.map(f => f.order), 0)

  const folder: ChatFolder = {
    id: crypto.randomUUID(),
    name,
    color,
    icon,
    conversationIds: [],
    isDefault: false,
    order: maxOrder + 1,
  }

  folders.push(folder)
  storage.set(STORAGE_KEYS.FOLDERS, folders)

  return folder
}

export const deleteFolder = (id: string): void => {
  let folders = getAllFolders()
  const folder = folders.find(f => f.id === id)

  if (folder && !folder.isDefault) {
    // Move conversations to recent
    folder.conversationIds.forEach(cid => {
      const conversation = getConversation(cid)
      if (conversation) {
        conversation.folderId = 'recent'
        saveConversation(conversation)
      }
    })

    folders = folders.filter(f => f.id !== id)
    storage.set(STORAGE_KEYS.FOLDERS, folders)
  }
}

export const renameFolder = (id: string, name: string): void => {
  const folders = getAllFolders()
  const folder = folders.find(f => f.id === id)

  if (folder && !folder.isDefault) {
    folder.name = name
    storage.set(STORAGE_KEYS.FOLDERS, folders)
  }
}

export const addConversationToFolder = (conversationId: string, folderId: string): void => {
  const folders = getAllFolders()
  const folder = folders.find(f => f.id === folderId)

  if (folder && !folder.conversationIds.includes(conversationId)) {
    folder.conversationIds.push(conversationId)
    storage.set(STORAGE_KEYS.FOLDERS, folders)
  }
}

export const removeConversationFromFolder = (conversationId: string, folderId: string): void => {
  const folders = getAllFolders()
  const folder = folders.find(f => f.id === folderId)

  if (folder) {
    folder.conversationIds = folder.conversationIds.filter(id => id !== conversationId)
    storage.set(STORAGE_KEYS.FOLDERS, folders)
  }
}

export const moveConversationToFolder = (conversationId: string, targetFolderId: string): void => {
  const conversation = getConversation(conversationId)
  if (!conversation) return

  const folders = getAllFolders()

  // Remove from all folders except starred and recent
  folders.forEach(folder => {
    if (folder.id !== 'starred' && folder.id !== 'recent') {
      folder.conversationIds = folder.conversationIds.filter(id => id !== conversationId)
    }
  })

  // Update conversation folder
  conversation.folderId = targetFolderId
  saveConversation(conversation)

  // Add to target folder
  addConversationToFolder(conversationId, targetFolderId)

  storage.set(STORAGE_KEYS.FOLDERS, folders)
}

export const getConversationsInFolder = (folderId: string): ChatConversation[] => {
  const folder = getFolder(folderId)
  if (!folder) return []

  const conversations = getAllConversations()

  // Special handling for dynamic folders
  if (folderId === 'recent') {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return conversations
      .filter(c => !c.archived && new Date(c.dateModified) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
  }

  if (folderId === 'starred') {
    return conversations
      .filter(c => c.starred && !c.archived)
      .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
  }

  if (folderId === 'archived') {
    return conversations
      .filter(c => c.archived)
      .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
  }

  // Regular folder
  return folder.conversationIds
    .map(id => getConversation(id))
    .filter((c): c is ChatConversation => c !== null)
    .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
}

// Search functionality
export const searchConversations = (filters: SearchFilters): SearchResult[] => {
  const conversations = getAllConversations()
  const results: SearchResult[] = []

  const query = filters.query.toLowerCase()

  conversations.forEach(conversation => {
    // Apply folder filter
    if (filters.folderId && conversation.folderId !== filters.folderId) return

    // Apply system type filter
    if (filters.systemType && conversation.systemType !== filters.systemType) return

    // Apply starred filter
    if (filters.starred !== undefined && conversation.starred !== filters.starred) return

    // Apply date filters
    if (filters.dateFrom && new Date(conversation.dateCreated) < new Date(filters.dateFrom)) return
    if (filters.dateTo && new Date(conversation.dateCreated) > new Date(filters.dateTo)) return

    // Search through messages
    conversation.messages.forEach(message => {
      // Apply message type filter
      if (filters.messageType && filters.messageType !== 'all' && message.role !== filters.messageType) return

      // Search in message content
      if (message.content.toLowerCase().includes(query)) {
        const highlightedContent = highlightSearchTerm(message.content, filters.query)

        results.push({
          conversationId: conversation.id,
          messageId: message.id,
          conversationTitle: conversation.title,
          messageContent: message.content,
          messageRole: message.role,
          timestamp: message.timestamp,
          systemType: conversation.systemType,
          highlightedContent,
        })
      }
    })
  })

  // Sort by most recent
  return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const highlightSearchTerm = (text: string, term: string): string => {
  if (!term) return text

  const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Recent searches
export const saveRecentSearch = (query: string): void => {
  if (!query.trim()) return

  let searches: string[] = storage.get(STORAGE_KEYS.RECENT_SEARCHES) || []
  searches = searches.filter(s => s !== query) // Remove duplicates
  searches.unshift(query)
  searches = searches.slice(0, 10) // Keep only 10 most recent

  storage.set(STORAGE_KEYS.RECENT_SEARCHES, searches)
}

export const getRecentSearches = (): string[] => {
  return storage.get(STORAGE_KEYS.RECENT_SEARCHES) || []
}

export const clearRecentSearches = (): void => {
  storage.set(STORAGE_KEYS.RECENT_SEARCHES, [])
}

// Current conversation
export const setCurrentConversation = (id: string): void => {
  storage.set(STORAGE_KEYS.CURRENT_CONVERSATION, id)
}

export const getCurrentConversation = (): string | null => {
  return storage.get(STORAGE_KEYS.CURRENT_CONVERSATION)
}

// Auto-archive old conversations (90 days)
export const autoArchiveOldConversations = (): void => {
  const conversations = getAllConversations()
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  conversations.forEach(conversation => {
    if (
      !conversation.archived &&
      !conversation.starred &&
      new Date(conversation.dateModified) < ninetyDaysAgo
    ) {
      archiveConversation(conversation.id)
    }
  })
}

// Generate conversation title from first message
export const generateConversationTitle = (firstMessage: string): string => {
  const maxLength = 60
  let cleaned = firstMessage.trim()

  // Remove common question starters to make title more concise
  const questionStarters = [
    'Can you help me with ',
    'Can you help me ',
    'Can you tell me ',
    'Can you explain ',
    'I need help with ',
    'I have a question about ',
    'What is ',
    'What are ',
    'How do I ',
    'How can I ',
    'How to ',
    'Why is ',
    'Why does ',
    'Why do ',
  ]

  for (const starter of questionStarters) {
    if (cleaned.toLowerCase().startsWith(starter.toLowerCase())) {
      cleaned = cleaned.substring(starter.length)
      // Capitalize first letter
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      break
    }
  }

  // If still too long, truncate
  if (cleaned.length > maxLength) {
    // Try to truncate at a word boundary
    const truncated = cleaned.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...'
    }
    return truncated + '...'
  }

  return cleaned
}
