import React, { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import EmptyState from '../Common/EmptyState'
import Loader from '../Common/Loader'
import {
  sendMessage,
  getChatMessages
} from '../../services/chatService'
import './chat.css'

const ChatBox = ({
  userId,
  activeSessionId,
  isNewChat,
  onSessionCreated
}) => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  /* --------------------------------
     Scroll to bottom
  --------------------------------- */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  /* --------------------------------
     Load messages when session changes
     (ONLY when switching chats)
  --------------------------------- */
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
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

    return () => {
      cancelled = true
    }
  }, [activeSessionId])

  /* --------------------------------
     Typing animation (SAFE)
  --------------------------------- */
  const typeAIResponse = async (answer, messageId) => {
    let current = ''

    for (let char of answer) {
      current += char
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: current }
            : msg
        )
      )
      await new Promise(r => setTimeout(r, 12))
    }
  }

  /* --------------------------------
     Send message
  --------------------------------- */
  const handleSendMessage = async (question, providedSessionId = null, attachment = null) => {
    if (!question.trim() || isLoading) return

    setIsLoading(true)

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: question,
      attachment: attachment ? {
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        file: attachment // Keep original file for download
      } : null,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const res = await sendMessage({
        question,
        userId,
        sessionId: providedSessionId || activeSessionId
      })

      if (!activeSessionId && res.session_id) {
        onSessionCreated(res.session_id)
      }



      const aiMessageId = Date.now() + 1

      const aiMessage = {
        id: aiMessageId,
        sender: 'ai',
        content: '',
        timestamp: new Date().toISOString()
      }

      // Add ONE AI bubble
      setMessages(prev => [...prev, aiMessage])

      // Animate response
      await typeAIResponse(res.answer, aiMessageId)

    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'ai',
          content:
            "Sorry, I'm having trouble connecting right now. Please try again later.",
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
          {messages.length === 0 ? (
            <EmptyState
              icon="🤖"
              title="Start a conversation"
              message="Ask questions about your studies or uploaded PDFs."
            />
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div className="loading-message">
                  <Loader size="small" text="AI is thinking..." />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          onSessionCreated={onSessionCreated}
          userId={userId}
          activeSessionId={activeSessionId}
        />


      </div>
    </div>
  )
}

export default ChatBox


// import React, { useEffect, useRef, useState } from 'react'
// import MessageBubble from './MessageBubble'
// import ChatInput from './ChatInput'
// import EmptyState from '../Common/EmptyState'
// import Loader from '../Common/Loader'
// import {
//   sendMessage,
//   getChatMessages
// } from '../../services/chatService'
// import './chat.css'

// const ChatBox = ({
//   userId,
//   activeSessionId,
//   onSessionCreated
// }) => {
//   const [messages, setMessages] = useState([])
//   const [isLoading, setIsLoading] = useState(false)
//   const messagesEndRef = useRef(null)

//   /* --------------------------------
//      Scroll to bottom on new messages
//   --------------------------------- */
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }

//   useEffect(() => {
//     scrollToBottom()
//   }, [messages, isLoading])

//   /* --------------------------------
//      Load messages when session changes
//   --------------------------------- */
//   useEffect(() => {
//     if (!activeSessionId) {
//       setMessages([])
//       return
//     }

//     const loadMessages = async () => {
//       try {
//         const data = await getChatMessages(activeSessionId)
//         setMessages(data)
//       } catch (err) {
//         console.error('Failed to load messages', err)
//       }
//     }

//     loadMessages()
//   }, [activeSessionId])


//   const typeMessage = async (fullText) => {
//     let current = ''
//     for (let char of fullText) {
//       current += char
//       setMessages(prev => [
//         ...prev.slice(0, -1),
//         { ...prev[prev.length - 1], content: current }
//       ])
//       await new Promise(r => setTimeout(r, 15))
//     }
//   }


//   /* --------------------------------
//      Send message (RAG backend)
//   --------------------------------- */
//   const handleSendMessage = async (question) => {
//     if (!question.trim() || isLoading) return

//     const tempUserMessage = {
//       id: Date.now(),
//       sender: 'user',
//       content: question,
//       timestamp: new Date().toISOString()
//     }

//     setMessages(prev => [...prev, tempUserMessage])
//     setIsLoading(true)

//     try {
//       const res = await sendMessage({
//         question,
//         userId,
//         sessionId: activeSessionId
//       })

//       // new session created by backend
//       if (!activeSessionId && res.session_id) {
//         onSessionCreated(res.session_id)
//       }

//       const aiMessage = {
//         id: Date.now() + 1,
//         sender: 'ai',
//         content: '',
//         timestamp: new Date().toISOString()
//       }

//       setMessages(prev => [...prev, aiMessage])

//       await typeMessage(res.answer)



//       setMessages(prev => [...prev, aiMessage])
//     } catch (error) {
//       setMessages(prev => [
//         ...prev,
//         {
//           id: Date.now() + 2,
//           sender: 'ai',
//           content:
//             "Sorry, I'm having trouble connecting right now. Please try again later.",
//           timestamp: new Date().toISOString()
//         }
//       ])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="chat-container">
//       <div className="chat-box">

//         {/* Messages */}
//         <div className="messages-container">
//           {messages.length === 0 ? (
//             <EmptyState
//               icon="🤖"
//               title="Start a conversation"
//               message="Ask questions about your studies or uploaded PDFs."
//             />
//           ) : (
//             <>
//               {messages.map(msg => (
//                 <MessageBubble key={msg.id} message={msg} />
//               ))}

//               {isLoading && (
//                 <div className="loading-message">
//                   <Loader size="small" text="AI is thinking..." />
//                 </div>
//               )}
//             </>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input (sticky bottom via CSS) */}
//         <ChatInput
//           onSendMessage={handleSendMessage}
//           disabled={isLoading}
//         />
//       </div>
//     </div>
//   )
// }

// export default ChatBox
