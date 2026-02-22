import React, { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import EmptyState from '../Common/EmptyState'
import SourcePreviewModal from './SourcePreviewModal'
import {
  sendMessage,
  getChatMessages
} from '../../services/chatService'

import './chat.css'

const ChatBox = ({
  userId,
  activeSessionId,
  isNewChat,
  onSessionCreated,
  onChatStarted
}) => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [chatMode, setChatMode] = useState('rag')
  const [previewSource, setPreviewSource] = useState(null)
  const messagesEndRef = useRef(null)
  // Tracks whether the current activeSessionId change was caused by THIS ChatBox
  // creating a new session while sending a message. When true, we skip the DB
  // reload so the locally-added user message isn't wiped before the API responds.
  const justCreatedRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages, isWaiting])

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }

    // If we just created this session while sending a message, skip the DB reload.
    // The user message is already in local state and the API hasn't saved it yet.
    // This prevents the locally-added first message from being wiped.
    if (justCreatedRef.current) {
      justCreatedRef.current = false
      return
    }

    let cancelled = false

    const loadMessages = async () => {
      try {
        const data = await getChatMessages(activeSessionId)
        if (!cancelled) setMessages(data)
      } catch (err) {
        console.error('Failed to load messages', err)
      }
    }

    loadMessages()

    return () => { cancelled = true }
  }, [activeSessionId])

  const typeAIResponse = async (answer, messageId) => {
    // Render 15 characters per frame at ~60fps — fast but still looks like streaming
    const CHUNK = 15
    const DELAY = 20
    let i = 0
    while (i < answer.length) {
      i = Math.min(i + CHUNK, answer.length)
      const current = answer.slice(0, i)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, content: current } : msg
        )
      )
      await new Promise(r => setTimeout(r, DELAY))
    }
  }

  // Called by ChatInput when a PDF is uploaded with no message typed.
  // On success the backend saves the confirmation to DB, so the useEffect
  // DB reload (triggered by activeSessionId change) will pick it up.
  const handleFileUploaded = (sessionId, filename) => {
    if (!filename) {
      setMessages(prev => [...prev, {
        id: Date.now(), sender: 'ai',
        content: '❌ Failed to upload the file. Please try again.',
        sources: [], timestamp: new Date().toISOString()
      }])
      return
    }
    setChatMode('rag')
    // Success message comes from DB reload (backend persists it).
    // No local message needed here — avoids duplicate on reload.
  }

  const handleSendMessage = async (question, providedSessionId = null, attachment = null) => {
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    setIsWaiting(true)

    // Mark that we are about to create/use a session while sending a message.
    // This prevents the useEffect from wiping the locally-added user message
    // when activeSessionId changes (either from file upload or API response).
    justCreatedRef.current = true

    // If this is the very first message, show placeholder in sidebar immediately
    if (!activeSessionId) {
      onChatStarted?.()
    }

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: question,
      attachment: attachment ? {
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        file: attachment
      } : null,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const res = await sendMessage({
        question,
        userId,
        sessionId: providedSessionId || activeSessionId,
        chatMode
      })

      if (!activeSessionId && res.session_id) {
        onSessionCreated(res.session_id)
      }

      setIsWaiting(false)

      const aiMessageId = Date.now() + 1
      const aiMessage = {
        id: aiMessageId,
        sender: 'ai',
        content: '',
        sources: res.sources || [],
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])
      await typeAIResponse(res.answer, aiMessageId)

    } catch (error) {
      setIsWaiting(false)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'ai',
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-box">

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 && !isWaiting ? (
            <EmptyState
              icon="🤖"
              title="Start a conversation"
              message="Ask questions about your studies or uploaded PDFs."
            />
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onSourceClick={(source) => setPreviewSource(source)}
                />
              ))}

              {isWaiting && (
                <div className="typing-row">
                  <div className="message-avatar">🤖</div>
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area with mode toggle */}
        <div className="chat-input-wrapper">
          <div className="chat-mode-chips">
            <button
              className={`mode-chip ${chatMode === 'general' ? 'active' : ''}`}
              onClick={() => setChatMode('general')}
            >
              🧠 General LLM
            </button>
            <button
              className={`mode-chip ${chatMode === 'rag' ? 'active' : ''}`}
              onClick={() => setChatMode('rag')}
            >
              📚 RAG Mode
            </button>
          </div>
          <ChatInput
            onSendMessage={handleSendMessage}
            onFileUploaded={handleFileUploaded}
            disabled={isLoading}
            onSessionCreated={onSessionCreated}
            userId={userId}
            activeSessionId={activeSessionId}
          />
        </div>
      </div>

      {previewSource && (
        <SourcePreviewModal
          documentName={previewSource.document_name}
          pageNumber={previewSource.page_number}
          pdfUrl={previewSource.doc_id
            ? `http://localhost:8000/resources/file/${previewSource.doc_id}`
            : null}
          onClose={() => setPreviewSource(null)}
        />
      )}
    </div>
  )
}

export default ChatBox
