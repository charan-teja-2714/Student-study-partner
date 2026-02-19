import React from 'react'

/* ----------------------------------------------------------------
   Simple markdown → JSX renderer (no external deps)
   Supports: headings, bold, italic, inline code, code blocks,
             bullet lists, numbered lists, line breaks
---------------------------------------------------------------- */
function renderMarkdown(text) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let i = 0
  let listBuffer = []
  let listType = null

  const flushList = () => {
    if (listBuffer.length === 0) return
    const Tag = listType === 'ol' ? 'ol' : 'ul'
    elements.push(
      <Tag key={`list-${elements.length}`} className="md-list">
        {listBuffer.map((item, idx) => (
          <li key={idx} className="md-li">{renderInline(item)}</li>
        ))}
      </Tag>
    )
    listBuffer = []
    listType = null
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.trimStart().startsWith('```')) {
      flushList()
      const lang = line.trim().slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={`code-${i}`} className="md-pre">
          {lang && <div className="md-code-lang">{lang}</div>}
          <code className="md-code-block">{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      flushList()
      elements.push(<h3 key={i} className="md-h3">{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(<h2 key={i} className="md-h2">{renderInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      flushList()
      elements.push(<h1 key={i} className="md-h1">{renderInline(line.slice(2))}</h1>)
    } else if (/^[-*] /.test(line)) {
      if (listType && listType !== 'ul') flushList()
      listType = 'ul'
      listBuffer.push(line.slice(2))
    } else if (/^\d+\. /.test(line)) {
      if (listType && listType !== 'ol') flushList()
      listType = 'ol'
      listBuffer.push(line.replace(/^\d+\. /, ''))
    } else if (line.trim() === '') {
      flushList()
      if (elements.length > 0) {
        elements.push(<div key={`br-${i}`} className="md-spacer" />)
      }
    } else {
      flushList()
      elements.push(<p key={i} className="md-p">{renderInline(line)}</p>)
    }

    i++
  }

  flushList()
  return elements
}

function renderInline(text) {
  if (!text) return null
  const parts = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('`')) {
      parts.push(<code key={match.index} className="md-inline-code">{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>)
    }
    last = match.index + token.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}

const MessageBubble = ({ message, onSourceClick }) => {
  const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const timeValue = message.created_at || message.timestamp
  const sources = message.sources || []
  const isAI = message.sender === 'ai'

  /* ---- AI message (no bubble, just avatar + text) ---- */
  if (isAI) {
    return (
      <div className="message-row ai">
        <div className="message-avatar">🤖</div>
        <div className="ai-content">
          {renderMarkdown(message.content)}
          {sources.length > 0 && (
            <div className="message-sources">
              <div className="sources-label">Sources:</div>
              {sources.map((src, idx) => (
                <button
                  key={idx}
                  className="source-chip"
                  onClick={() => onSourceClick && onSourceClick(src)}
                >
                  📄 {src.document_name} – Page {src.page_number}
                </button>
              ))}
            </div>
          )}
          <span className="message-time">{formatTime(timeValue)}</span>
        </div>
      </div>
    )
  }

  /* ---- User message (dark blue pill, right-aligned) ---- */
  return (
    <div className="message-row user">
      <div className="user-message-group">
        <div className="user-bubble">
          {message.attachment && (
            <div
              className="attachment-display clickable"
              onClick={() => {
                const link = document.createElement('a')
                link.href = URL.createObjectURL(message.attachment.file)
                link.download = message.attachment.name
                link.click()
              }}
            >
              📄 {message.attachment.name}
            </div>
          )}
          {message.content}
        </div>
        <span className="message-time">{formatTime(timeValue)}</span>
      </div>
    </div>
  )
}

export default MessageBubble
