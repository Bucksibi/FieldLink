export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  systemType: string | null
  diagnosticId: string | null
  dateCreated: string
  dateModified: string
  folderId: string
  starred: boolean
  tags: string[]
  archived: boolean
}

export interface ChatFolder {
  id: string
  name: string
  color: string
  icon: string
  conversationIds: string[]
  isDefault: boolean
  order: number
}

export interface SearchFilters {
  query: string
  dateFrom?: string
  dateTo?: string
  systemType?: string
  messageType?: 'all' | 'user' | 'assistant'
  folderId?: string
  starred?: boolean
}

export interface SearchResult {
  conversationId: string
  messageId: string
  conversationTitle: string
  messageContent: string
  messageRole: 'user' | 'assistant'
  timestamp: string
  systemType: string | null
  highlightedContent: string
}

export const DEFAULT_FOLDERS: Omit<ChatFolder, 'conversationIds'>[] = [
  {
    id: 'recent',
    name: 'Recent Conversations',
    color: '#3b82f6',
    icon: 'clock',
    isDefault: true,
    order: 0,
  },
  {
    id: 'starred',
    name: 'Saved/Starred',
    color: '#f59e0b',
    icon: 'star',
    isDefault: true,
    order: 1,
  },
  {
    id: 'gas-split',
    name: 'Gas Split AC',
    color: '#10b981',
    icon: 'system',
    isDefault: true,
    order: 2,
  },
  {
    id: 'heat-pump',
    name: 'Heat Pump',
    color: '#ef4444',
    icon: 'system',
    isDefault: true,
    order: 3,
  },
  {
    id: 'archived',
    name: 'Archived',
    color: '#6b7280',
    icon: 'archive',
    isDefault: true,
    order: 999,
  },
]
