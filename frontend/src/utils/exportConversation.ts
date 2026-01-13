import { ChatConversation } from '../types/chat'

export const exportAsText = (conversation: ChatConversation) => {
  let content = `# ${conversation.title}\n\n`
  content += `Date: ${new Date(conversation.dateCreated).toLocaleDateString()}\n`
  if (conversation.systemType) {
    content += `System Type: ${conversation.systemType}\n`
  }
  if (conversation.diagnosticId) {
    content += `Diagnostic ID: ${conversation.diagnosticId}\n`
  }
  content += `\n${'='.repeat(60)}\n\n`

  conversation.messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'Technician' : 'Sensei AI'
    const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    content += `[${timestamp}] ${role}:\n`
    content += `${msg.content}\n\n`

    if (index < conversation.messages.length - 1) {
      content += `${'-'.repeat(60)}\n\n`
    }
  })

  content += `\n${'='.repeat(60)}\n`
  content += `\nExported from FieldSync HVAC Sensei Assistant\n`
  content += `${new Date().toLocaleString()}\n`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const fileName = conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  a.download = `${fileName}_${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportAsMarkdown = (conversation: ChatConversation) => {
  let content = `# ${conversation.title}\n\n`
  content += `**Date:** ${new Date(conversation.dateCreated).toLocaleDateString()}\n\n`

  if (conversation.systemType || conversation.diagnosticId) {
    content += `## Metadata\n\n`
    if (conversation.systemType) {
      content += `- **System Type:** ${conversation.systemType}\n`
    }
    if (conversation.diagnosticId) {
      content += `- **Diagnostic ID:** ${conversation.diagnosticId}\n`
    }
    content += `\n`
  }

  content += `---\n\n`
  content += `## Conversation\n\n`

  conversation.messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '🔧 **Technician**' : '🥋 **Sensei AI**'
    const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    content += `### ${role} - ${timestamp}\n\n`
    content += `${msg.content}\n\n`

    if (index < conversation.messages.length - 1) {
      content += `---\n\n`
    }
  })

  content += `\n---\n\n`
  content += `*Exported from FieldSync HVAC Sensei Assistant*  \n`
  content += `*${new Date().toLocaleString()}*\n`

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const fileName = conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  a.download = `${fileName}_${Date.now()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportAsHTML = (conversation: ChatConversation) => {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${conversation.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .metadata {
      background: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #3b82f6;
    }
    .message {
      background: white;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .message-role {
      font-weight: 600;
      font-size: 14px;
    }
    .message-role.user {
      color: #3b82f6;
    }
    .message-role.assistant {
      color: #10b981;
    }
    .message-timestamp {
      color: #6b7280;
      font-size: 12px;
    }
    .message-content {
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${conversation.title}</h1>
    <p>Date: ${new Date(conversation.dateCreated).toLocaleString()}</p>
  </div>

  ${conversation.systemType || conversation.diagnosticId ? `
  <div class="metadata">
    ${conversation.systemType ? `<p><strong>System Type:</strong> ${conversation.systemType}</p>` : ''}
    ${conversation.diagnosticId ? `<p><strong>Diagnostic ID:</strong> ${conversation.diagnosticId}</p>` : ''}
  </div>
  ` : ''}

  <div class="messages">
`

  conversation.messages.forEach((msg) => {
    const role = msg.role === 'user' ? '🔧 Technician' : '🥋 Sensei AI'
    const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    html += `
    <div class="message">
      <div class="message-header">
        <span class="message-role ${msg.role}">${role}</span>
        <span class="message-timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${msg.content.replace(/\n/g, '<br>')}</div>
    </div>
`
  })

  html += `
  </div>

  <div class="footer">
    <p>Exported from FieldSync HVAC Sensei Assistant</p>
    <p>${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const fileName = conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  a.download = `${fileName}_${Date.now()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
