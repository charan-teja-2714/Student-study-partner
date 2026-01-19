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

  const timeValue = message.created_at || message.timestamp

  return (
    <div className={`message-bubble ${message.sender}`}>

      {message.sender === 'ai' && (
        <div className="message-avatar">🤖</div>
      )}

      <div className="message-content">
        {/* Show attachment if present */}
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
