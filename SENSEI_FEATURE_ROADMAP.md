# Sensei Chat Feature Implementation Roadmap

## Current Status Summary

### ✅ Already Implemented
- Auto-save conversations to localStorage
- Auto-generate conversation titles from first message
- User-created folder organization
- Move conversations between folders (right-click context menu)
- Voice input for hands-free operation
- File attachments (camera + gallery)
- Diagnostic system type context
- Keyboard shortcuts (Ctrl+N new chat, Ctrl+F search)
- Loading indicators with animated "Sensei is thinking"
- Message timestamps
- Conversation deletion with confirmation
- Inline conversation renaming

### ⚠️ Partially Implemented
- Search UI (exists but needs full implementation)
- Diagnostic linking (system type shown, but not full integration)

### ❌ Not Yet Implemented
See priority tiers below

---

## Implementation Priority Tiers

### 🔴 **TIER 1: Critical Quick Wins** (Immediate Impact)
*Implementation Time: 2-3 hours*

#### 1.1 Copy Message Button
**Value**: High - Techs need to copy AI responses into service reports
**Implementation**:
```typescript
// Add to each assistant message:
<button onClick={() => navigator.clipboard.writeText(message.content)}>
  Copy
</button>
```
**Files**: `AIChatPage.tsx` (line ~905)

#### 1.2 Export Conversation
**Value**: Critical - Required for service documentation
**Formats**: PDF, Text, Markdown
**Implementation**:
```typescript
const exportConversation = (format: 'pdf' | 'txt' | 'md') => {
  // Use jsPDF for PDF
  // Simple blob download for txt/md
}
```
**Files**: New utility `exportUtils.ts`, add button to action bar

#### 1.3 Regenerate Response
**Value**: High - When AI answer isn't helpful
**Implementation**:
```typescript
const regenerateResponse = (messageId: string) => {
  const messageIndex = messages.findIndex(m => m.id === messageId)
  // Remove AI response and resend user message
}
```
**Files**: `AIChatPage.tsx`, add button next to assistant messages

#### 1.4 Search Within Conversation
**Value**: High - Find specific info in long chats
**Implementation**:
```typescript
// Ctrl+F opens search overlay
// Highlight matching text in messages
// Next/Previous buttons
```
**Files**: New component `ConversationSearch.tsx`

#### 1.5 Typing Indicator (Real-time)
**Value**: Medium - Better UX feedback
**Implementation**: Show "Sensei is analyzing..." with progress stages
**Files**: `AIChatPage.tsx` - enhance existing loading state

---

### 🟠 **TIER 2: High-Value Enhancements** (1 week)
*Significantly improve usability*

#### 2.1 Message Actions
- Edit previous messages
- Delete individual messages
- Pin important messages (star icon)
- Message reactions (thumbs up/down for feedback)

#### 2.2 Advanced Search Implementation
- Full-text search across all conversations
- Date range filters
- Filter by diagnostic linked
- Filter by system type/refrigerant
- Search history and suggestions

#### 2.3 Smart Folder Features
- Folder colors (user-assigned)
- Auto-categorization by system type
- Auto-categorization by issue severity
- Drag & drop conversations between folders

#### 2.4 Export Enhancements
- Export with images embedded
- Email conversation directly
- Export multiple conversations as batch

#### 2.5 Diagnostic Context Integration
- Auto-pull pressure readings into chat context
- Show diagnostic data in sidebar when chat linked
- "View Full Diagnostic" button in chat

---

### 🟡 **TIER 3: Advanced Features** (2-3 weeks)
*Power user features and team collaboration*

#### 3.1 Collaboration
- Share conversation (generate link)
- Add private notes to conversations
- @mention team members
- Conversation templates

#### 3.2 AI Response Enhancements
- Show confidence scores
- Alternative diagnoses
- Interactive calculations (expandable)
- Source citations

#### 3.3 Smart Context
- Suggested follow-up questions
- Related conversations finder
- Cross-conversation memory
- Knowledge base integration

#### 3.4 Rich Input
- Rich text formatting (bold, italic, code)
- Paste images from clipboard
- Character/token counter
- Multi-file attachments

---

### 🟢 **TIER 4: Nice-to-Have** (Future)
*Polish and advanced integrations*

#### 4.1 Mobile Optimizations
- Swipe gestures
- Voice-first mode
- Offline queue
- Quick reply suggestions

#### 4.2 Analytics & Insights
- Time saved calculator
- Popular questions dashboard
- Knowledge gap identification
- Conversation statistics

#### 4.3 Advanced Integrations
- Calendar integration
- Email integration
- SMS notifications
- Third-party tool connectors

#### 4.4 Nested Folders & Organization
- Subfolders (Customer → Sites)
- Bulk operations (select multiple)
- Folder templates
- Auto-archive rules

---

## Detailed Implementation Plans

### Feature: Copy Message Button

**Location**: `AIChatPage.tsx` line ~904-910

**Current Code**:
```typescript
<div className="whitespace-pre-wrap break-words text-white">
  {message.content}
</div>
```

**New Code**:
```typescript
<div className="group relative">
  <div className="whitespace-pre-wrap break-words text-white">
    {message.content}
  </div>
  {message.role === 'assistant' && (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
      <button
        onClick={() => {
          navigator.clipboard.writeText(message.content)
          // Show toast: "Copied to clipboard"
        }}
        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
        title="Copy message"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        onClick={() => regenerateResponse(message.id)}
        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
        title="Regenerate response"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  )}
</div>
```

---

### Feature: Export Conversation

**New Utility**: `frontend/src/utils/exportConversation.ts`

```typescript
import jsPDF from 'jspdf'
import { ChatConversation } from '../types/chat'

export const exportAsPDF = (conversation: ChatConversation) => {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(16)
  doc.text(conversation.title, 10, 10)

  // Add metadata
  doc.setFontSize(10)
  doc.text(`Date: ${new Date(conversation.dateCreated).toLocaleDateString()}`, 10, 20)
  if (conversation.systemType) {
    doc.text(`System: ${conversation.systemType}`, 10, 25)
  }

  // Add messages
  let yPosition = 35
  conversation.messages.forEach((msg) => {
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text(msg.role === 'user' ? 'You:' : 'Sensei:', 10, yPosition)

    doc.setFont(undefined, 'normal')
    const lines = doc.splitTextToSize(msg.content, 180)
    doc.text(lines, 10, yPosition + 5)
    yPosition += lines.length * 5 + 10

    if (yPosition > 270) {
      doc.addPage()
      yPosition = 10
    }
  })

  doc.save(`${conversation.title}.pdf`)
}

export const exportAsText = (conversation: ChatConversation) => {
  let content = `# ${conversation.title}\n\n`
  content += `Date: ${new Date(conversation.dateCreated).toLocaleDateString()}\n`
  if (conversation.systemType) {
    content += `System: ${conversation.systemType}\n`
  }
  content += '\n---\n\n'

  conversation.messages.forEach((msg) => {
    content += `**${msg.role === 'user' ? 'You' : 'Sensei'}**: ${msg.content}\n\n`
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${conversation.title}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
```

**Add to Action Bar** (`AIChatPage.tsx` line ~723-759):
```typescript
<button
  onClick={() => {
    // Show export menu
    setShowExportMenu(true)
  }}
  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-500/10 transition-all flex items-center gap-2"
  title="Export conversation"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  Export
</button>
```

---

### Feature: Search Within Conversation

**New Component**: `frontend/src/components/ConversationSearch.tsx`

```typescript
interface ConversationSearchProps {
  messages: Message[]
  isOpen: boolean
  onClose: () => void
}

export default function ConversationSearch({ messages, isOpen, onClose }: ConversationSearchProps) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matches, setMatches] = useState<number[]>([])

  useEffect(() => {
    if (!query) {
      setMatches([])
      return
    }

    const matchingIndices = messages
      .map((msg, index) => msg.content.toLowerCase().includes(query.toLowerCase()) ? index : -1)
      .filter(index => index !== -1)

    setMatches(matchingIndices)
    setCurrentIndex(0)
  }, [query, messages])

  if (!isOpen) return null

  return (
    <div className="absolute top-0 right-0 m-4 p-4 bg-slate-800 rounded-lg shadow-xl border border-slate-600 z-50">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in conversation..."
          className="px-3 py-2 bg-slate-700 text-white rounded-lg outline-none"
          autoFocus
        />
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {matches.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span>{currentIndex + 1} of {matches.length}</span>
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="p-1 hover:bg-slate-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => setCurrentIndex(Math.min(matches.length - 1, currentIndex + 1))} className="p-1 hover:bg-slate-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## Database Schema Updates Needed

### For Full Implementation, Add Tables:

```sql
-- Message reactions
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  message_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  reaction_type TEXT NOT NULL, -- 'thumbs_up', 'thumbs_down', 'star'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shared conversations
CREATE TABLE shared_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  shared_by UUID REFERENCES users(id),
  share_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation notes
CREATE TABLE conversation_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),
  note_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events
CREATE TABLE chat_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL, -- 'message_sent', 'response_copied', 'conversation_exported'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Dependencies to Install

```json
{
  "jspdf": "^2.5.1",  // For PDF export
  "react-markdown": "^8.0.7",  // For rich markdown in messages
  "date-fns": "^2.30.0",  // Better date formatting
  "fuse.js": "^6.6.2"  // Fuzzy search for conversations
}
```

---

## Next Steps

1. **Review this roadmap** with the team
2. **Prioritize Tier 1** - Implement in next 2-3 hours
3. **Schedule Tier 2** - Plan for next sprint
4. **Gather feedback** on which features are most valuable
5. **Update based on user testing**

