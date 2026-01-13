import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatConversation } from '../types/chat'
import {
  getAllConversations,
  deleteConversation,
  updateConversationTitle,
} from '../utils/chatStorage'

interface ChatFolder {
  id: string
  name: string
  conversationIds: string[]
}

interface ChatSidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onToggle: () => void
}

export default function ChatSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [folders, setFolders] = useState<ChatFolder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['uncategorized']))
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    conversationId: string
  } | null>(null)
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [currentConversationId])

  const loadData = () => {
    // Load folders from localStorage
    const savedFolders = localStorage.getItem('hvac_chat_folders')
    const loadedFolders: ChatFolder[] = savedFolders ? JSON.parse(savedFolders) : []
    setFolders(loadedFolders)

    // Load conversations
    const allConvs = getAllConversations()
    const sorted = allConvs.sort((a, b) =>
      new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime()
    )
    setConversations(sorted)
  }

  const saveFolders = (newFolders: ChatFolder[]) => {
    localStorage.setItem('hvac_chat_folders', JSON.stringify(newFolders))
    setFolders(newFolders)
  }

  const createFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: ChatFolder = {
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      conversationIds: [],
    }

    const updatedFolders = [...folders, newFolder]
    saveFolders(updatedFolders)
    setExpandedFolders(new Set([...expandedFolders, newFolder.id]))
    setNewFolderName('')
    setIsCreatingFolder(false)
  }

  const deleteFolder = (folderId: string) => {
    if (confirm('Delete this folder? Conversations inside will be moved to Uncategorized.')) {
      const updatedFolders = folders.filter(f => f.id !== folderId)
      saveFolders(updatedFolders)
      loadData()
    }
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversationId,
    })
  }

  const handleRename = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setEditingConversationId(conversationId)
      setEditingTitle(conversation.title)
    }
    setContextMenu(null)
  }

  const saveRename = () => {
    if (editingConversationId && editingTitle.trim()) {
      updateConversationTitle(editingConversationId, editingTitle.trim())
      loadData()
    }
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleDelete = (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId)

      // Remove from folders
      const updatedFolders = folders.map(folder => ({
        ...folder,
        conversationIds: folder.conversationIds.filter(id => id !== conversationId)
      }))
      saveFolders(updatedFolders)

      loadData()

      if (conversationId === currentConversationId) {
        onNewConversation()
      }
    }
    setContextMenu(null)
  }

  const handleMoveToFolder = (conversationId: string, folderId: string) => {
    // Remove from all folders
    const updatedFolders = folders.map(folder => ({
      ...folder,
      conversationIds: folder.conversationIds.filter(id => id !== conversationId)
    }))

    // Add to target folder
    const targetFolder = updatedFolders.find(f => f.id === folderId)
    if (targetFolder) {
      targetFolder.conversationIds.push(conversationId)
    }

    saveFolders(updatedFolders)
    setContextMenu(null)
  }

  const getConversationsInFolder = (folderId: string): ChatConversation[] => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return []

    return conversations.filter(conv => folder.conversationIds.includes(conv.id))
  }

  const getUncategorizedConversations = (): ChatConversation[] => {
    const categorizedIds = new Set(folders.flatMap(f => f.conversationIds))
    return conversations.filter(conv => !categorizedIds.has(conv.id))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const renderConversation = (conv: ChatConversation) => {
    const isActive = conv.id === currentConversationId
    const isEditing = editingConversationId === conv.id

    return (
      <div
        key={conv.id}
        onContextMenu={(e) => handleContextMenu(e, conv.id)}
        className={`
          relative group rounded-lg p-2.5 cursor-pointer transition-all
          ${isActive
            ? 'bg-blue-500/20 border border-blue-500/50'
            : 'hover:bg-slate-700/50 border border-transparent'
          }
        `}
        onClick={() => !isEditing && onSelectConversation(conv.id)}
      >
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename()
              if (e.key === 'Escape') {
                setEditingConversationId(null)
                setEditingTitle('')
              }
            }}
            className="w-full px-2 py-1 bg-slate-800 text-white rounded border border-blue-500 outline-none text-xs"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-100'}`} style={{
                  textShadow: isActive ? '0 2px 4px rgba(59, 130, 246, 0.5), 0 0 10px rgba(59, 130, 246, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.5)',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}>
                  {conv.title || 'New Conversation'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {formatDate(conv.dateModified)}
                </p>
              </div>

              <div className={`flex items-center gap-0.5 ${isActive || 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRename(conv.id)
                  }}
                  className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                  title="Rename"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(conv.id)
                  }}
                  className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 w-80 h-screen border-r border-slate-700 flex flex-col z-30"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide" style={{
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}>
            Conversations
          </h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            title="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Folders and Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-2">
            {/* Folders */}
            {folders.map((folder) => {
              const folderConvs = getConversationsInFolder(folder.id)
              const isExpanded = expandedFolders.has(folder.id)

              return (
                <div key={folder.id} className="mb-2">
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-700/30 cursor-pointer group">
                    <div
                      className="flex-1 flex items-center gap-2"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <svg
                        className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))'
                      }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-100" style={{
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                      }}>{folder.name}</span>
                      <span className="text-xs text-slate-400 font-medium">({folderConvs.length})</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFolder(folder.id)
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                      title="Delete folder"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {folderConvs.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic px-2 py-1">No conversations</p>
                      ) : (
                        folderConvs.map(renderConversation)
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Uncategorized */}
            <div className="mb-2">
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/30 cursor-pointer"
                onClick={() => toggleFolder('uncategorized')}
              >
                <svg
                  className={`w-3 h-3 text-slate-400 transition-transform ${expandedFolders.has('uncategorized') ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm font-semibold text-slate-300" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}>Uncategorized</span>
                <span className="text-xs text-slate-400 font-medium">({getUncategorizedConversations().length})</span>
              </div>

              {expandedFolders.has('uncategorized') && (
                <div className="ml-4 mt-1 space-y-1">
                  {getUncategorizedConversations().length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic px-2 py-1">No conversations</p>
                  ) : (
                    getUncategorizedConversations().map(renderConversation)
                  )}
                </div>
              )}
            </div>

            {/* Create Folder UI */}
            {isCreatingFolder && (
              <div className="px-2 py-2 bg-slate-700/30 rounded-lg">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => {
                    if (!newFolderName.trim()) setIsCreatingFolder(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createFolder()
                    if (e.key === 'Escape') {
                      setIsCreatingFolder(false)
                      setNewFolderName('')
                    }
                  }}
                  placeholder="Folder name..."
                  className="w-full px-2 py-1.5 bg-slate-800 text-white rounded border border-blue-500 outline-none text-xs"
                  autoFocus
                />
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={createFolder}
                    className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingFolder(false)
                      setNewFolderName('')
                    }}
                    className="flex-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-700/50 space-y-2">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="w-full px-4 py-2.5 rounded-lg font-semibold bg-slate-700/80 hover:bg-slate-600 text-slate-100 transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Folder
          </button>
          <button
            onClick={onNewConversation}
            className="w-full px-4 py-2.5 rounded-lg font-semibold bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            New Chat
          </button>
        </div>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 w-48 rounded-lg shadow-xl border border-slate-600 overflow-hidden"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                onClick={() => handleRename(contextMenu.conversationId)}
                className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Rename
              </button>

              {folders.length > 0 && (
                <>
                  <div className="border-t border-slate-600" />
                  <div className="px-2 py-1 text-[10px] text-slate-500 font-medium">Move to folder</div>
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => handleMoveToFolder(contextMenu.conversationId, folder.id)}
                      className="w-full px-4 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {folder.name}
                    </button>
                  ))}
                </>
              )}

              <div className="border-t border-slate-600" />
              <button
                onClick={() => handleDelete(contextMenu.conversationId)}
                className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
