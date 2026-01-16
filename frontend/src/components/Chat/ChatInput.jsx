// import React, { useState } from 'react'
// import AttachmentPopover from './AttachmentPopover'
// import AttachmentPreview from './AttachmentPreview'
// import { uploadStudentPDF } from '../../services/uploadService'

// const ChatInput = ({ onSendMessage, disabled }) => {

//   // ✅ MUST BE NUMBER
//   const userId = Number(localStorage.getItem('userId')) || 1

//   const [message, setMessage] = useState('')
//   const [showPopover, setShowPopover] = useState(false)
//   const [attachment, setAttachment] = useState(null)
//   const [uploading, setUploading] = useState(false)

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     if (!message.trim() && !attachment) return

//     let attachmentInfo = null

//     try {
//       if (attachment) {
//         setUploading(true)
//         await uploadStudentPDF(attachment, userId)
//         attachmentInfo = `📎 Attached: ${attachment.name}`
//       }

//       // ✅ SEND ONLY STRING
//       onSendMessage(message || attachmentInfo)

//       setMessage('')
//       setAttachment(null)
//     } finally {
//       setUploading(false)
//     }
//   }

//   return (
//     <form className="chat-input-form" onSubmit={handleSubmit}>
//       {attachment && (
//         <AttachmentPreview
//           file={attachment}
//           onRemove={() => setAttachment(null)}
//         />
//       )}

//       <div className="input-container attachment-wrapper">
//         <div className="attach-container">
//           <button
//             type="button"
//             className="attach-button"
//             onClick={() => setShowPopover(!showPopover)}
//             disabled={disabled || uploading}
//           >
//             +
//           </button>

//           <AttachmentPopover
//             open={showPopover}
//             onClose={() => setShowPopover(false)}
//             onSelect={(file) => setAttachment(file)}
//           />
//         </div>

//         <textarea
//           className="message-input"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           placeholder="Message Academic Assistant…"
//           disabled={disabled || uploading}
//           rows="1"
//           onKeyDown={(e) => {
//             if (e.key === 'Enter' && !e.shiftKey) {
//               e.preventDefault()   // ❌ stop new line
//               handleSubmit(e)      // ✅ submit message
//             }
//           }}
//         />


//         <button
//           type="submit"
//           className="send-button"
//           disabled={disabled || uploading}
//         >
//           ➤
//         </button>
//       </div>
//     </form>
//   )
// }

// export default ChatInput


import React, { useState, useRef, useEffect } from 'react'
import AttachmentPopover from './AttachmentPopover'
import AttachmentPreview from './AttachmentPreview'
import { uploadStudentPDF } from '../../services/uploadService'

const ChatInput = ({
  onSendMessage,
  disabled,
  onSessionCreated,
  userId,
  activeSessionId,
  onTypingStart,
  onTypingStop,
}) => {
  // const userId = Number(localStorage.getItem('userId')) || 1

  const [message, setMessage] = useState('')
  const [showPopover, setShowPopover] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [uploading, setUploading] = useState(false)

  const textareaRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  /* -------------------------------
     Auto-grow textarea
  -------------------------------- */
  useEffect(() => {
    if (!textareaRef.current) return

    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height =
      textareaRef.current.scrollHeight + 'px'
  }, [message])

  /* -------------------------------
     Typing indicator logic
  -------------------------------- */
  const handleTyping = (value) => {
    setMessage(value)

    if (onTypingStart) onTypingStart()

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) onTypingStop()
    }, 800)
  }



  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   if (!message.trim() && !attachment) return
  //   let attachmentInfo = null
  //   try {
  //     if (attachment) {
  //       setUploading(true)
  //       await uploadStudentPDF(attachment, userId, activeSessionId)

  //       attachmentInfo = `📎 Attached: ${attachment.name}`

  //       if (!activeSessionId && res.activeSessionId) {
  //         onSessionCreated(res.activeSessionId)
  //       }


  //     }

  //     onSendMessage(message.trim() || attachmentInfo)
  //     setMessage("")
  //     setAttachment(null)

  //   } finally {
  //     setUploading(false)
  //   }
  // }
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!message.trim() && !attachment) return

  let sessionId = activeSessionId

  try {
    // 🔹 Upload first (session auto-created if needed)
    if (attachment) {
      setUploading(true)
      const res = await uploadStudentPDF(
        attachment,
        userId,
        sessionId
      )

      // 🔑 capture new session_id from backend
      if (!sessionId && res.session_id) {
        sessionId = res.session_id
        onSessionCreated?.(sessionId)
      }
    }

    // 🔹 Send chat message (now session exists)
    if (message.trim()) {
      await onSendMessage(message.trim(), sessionId)
    }

    setMessage("")
    setAttachment(null)

  } finally {
    setUploading(false)
  }
}


  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      {attachment && (
        <AttachmentPreview
          file={attachment}
          onRemove={() => setAttachment(null)}
        />
      )}

      <div className="input-container attachment-wrapper">
        <div className="attach-container">
          <button
            type="button"
            className="attach-button"
            onClick={() => setShowPopover(!showPopover)}
            disabled={disabled || uploading}
          >
            +
          </button>

          <AttachmentPopover
            open={showPopover}
            onClose={() => setShowPopover(false)}
            onSelect={(file) => setAttachment(file)}
          />
        </div>

        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Message Academic Assistant…"
          disabled={disabled || uploading}
          rows={1}
          onKeyDown={(e) => {
            // ✅ Desktop & mobile Enter handling
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit({ preventDefault: () => { } })
            }
          }}
        />

        <button
          type="submit"
          className="send-button"
          disabled={disabled || uploading}
        >
          ➤
        </button>
      </div>
    </form>
  )
}

export default ChatInput
