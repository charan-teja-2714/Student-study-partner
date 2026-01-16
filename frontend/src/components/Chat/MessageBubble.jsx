// import React from 'react'

// const MessageBubble = ({ message }) => {
//   const formatTime = (timestamp) =>
//     new Date(timestamp).toLocaleTimeString([], {
//       hour: '2-digit',
//       minute: '2-digit'
//     })

//   return (
//     <div className={`message-bubble ${message.sender}`}>
      
//       {/* AI avatar */}
//       {message.sender === 'ai' && (
//         <div className="message-avatar">🤖</div>
//       )}

//       <div className="message-content">
//         <p className="message-text">
//           {message.content}
//         </p>
//         <span className="message-time">
//           {formatTime(message.timestamp)}
//         </span>
//       </div>

//     </div>
//   )
// }

// export default MessageBubble

import React from 'react'

const MessageBubble = ({ message }) => {
  const formatTime = (value) => {
    if (!value) return ''

    const date = new Date(value)
    if (isNaN(date.getTime())) return ''

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 🔑 Prefer backend time, fallback to frontend time
  const timeValue = message.created_at || message.timestamp

  return (
    <div className={`message-bubble ${message.sender}`}>

      {/* AI avatar */}
      {message.sender === 'ai' && (
        <div className="message-avatar">🤖</div>
      )}

      <div className="message-content">
        <p className="message-text">
          {message.content}
        </p>

        <span className="message-time">
          {formatTime(timeValue)}
        </span>
      </div>

    </div>
  )
}

export default MessageBubble
