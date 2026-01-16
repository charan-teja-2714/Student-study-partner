import React, { useState, useRef, useEffect } from 'react'
import './chatSidebar.css'

const ChatSidebar = ({
  chats = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onRename,
  onDelete,
  onPin,
  isOpen,
  onClose
}) => {
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  /* -------------------------------
     Close menu / rename on outside click
  -------------------------------- */
  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpenId(null)
        setEditingId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const startRename = (chat) => {
    setEditingId(chat.id)
    setTitle(chat.title || '')
    setMenuOpenId(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const submitRename = (force = false) => {
    if (!editingId) return

    const finalTitle = title.trim()

    if (finalTitle) {
      onRename(editingId, finalTitle)
    }

    setEditingId(null)
    setMenuOpenId(null)   // 🔑 CLOSE MENU
  }



  return (
    <aside className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">Chats</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* New Chat */}
      <button className="new-chat-btn" onClick={onNewChat}>
        ＋ New chat
      </button>

      {/* Chat list */}
      <div className="chat-list">
        {chats.length === 0 && (
          <div className="no-chats">No conversations yet</div>
        )}

        {chats.map(chat => (
          <div key={chat.id}
            className="chat-row"
            onContextMenu={(e) => {
              e.preventDefault()                 // 🚫 disable browser menu
              setMenuOpenId(chat.id)             // ✅ open our menu
            }}>

            {/* Chat title / rename */}
            {editingId === chat.id ? (
              <input
                ref={inputRef}
                className="chat-rename-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => submitRename(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenuOpenId(chat.id)
                }}
              />
            ) : (
              <button
                className={`chat-item ${chat.id === activeChatId ? 'active' : ''
                  }`}
                onClick={() => onSelectChat(chat.id)}
              >
                {chat.pinned && <span className="pin-icon">📌</span>}
                {chat.title || 'New chat'}
              </button>
            )}

            {/* 3 dots (hover only) */}
            <button
              className="chat-menu-trigger"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpenId(chat.id)
              }}
            >
              ⋮
            </button>

            {/* Context menu */}
            {menuOpenId === chat.id && (
              <div className="chat-menu" ref={menuRef}>
                <button onClick={() => startRename(chat)}>Rename</button>
                <button
                  onClick={() => {
                    onPin(chat.id)
                    setMenuOpenId(null)
                  }}
                >
                  {chat.pinned ? 'Unpin' : 'Pin'}
                </button>

                <button
                  className="danger"
                  onClick={() => {
                    onDelete(chat.id)
                    setMenuOpenId(null)
                  }}
                >
                  Delete
                </button>

              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

export default ChatSidebar


// import React, { useState, useRef, useEffect } from 'react'
// import './chatSidebar.css'

// const ChatSidebar = ({
//   chats = [],
//   activeChatId,
//   onSelectChat,
//   onNewChat,
//   onRename,
//   onDelete,
//   onPin,
//   isOpen,
//   onClose
// }) => {

//   const [openMenuId, setOpenMenuId] = useState(null)
//   const renameRef = useRef(null)

//   const [menuOpenId, setMenuOpenId] = useState(null)
//   const [editingId, setEditingId] = useState(null)
//   const [title, setTitle] = useState('')
//   const menuRef = useRef(null)
//   const inputRef = useRef(null)

//   /* --------------------------------
//      Close rename on outside click
//   -------------------------------- */
//   useEffect(() => {
//     const handler = (e) => {
//       if (
//         menuRef.current &&
//         !menuRef.current.contains(e.target)
//       ) {
//         setMenuOpenId(null)
//         setEditingId(null)
//       }
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [])

//   const startRename = (chat) => {
//     setEditingId(chat.id)
//     setTitle(chat.title || '')
//     setMenuOpenId(null)
//     setTimeout(() => inputRef.current?.focus(), 0)
//   }

//   const submitRename = () => {
//     if (title.trim()) {
//       onRename(editingId, title.trim())
//     }
//     setEditingId(null)
//   }

//   return (
//     <aside className={`chat-sidebar ${isOpen ? 'open' : ''}`}>

//       {/* Header */}
//       <div className="sidebar-header">
//         <span className="sidebar-title">Chats</span>
//         <button className="close-btn" onClick={onClose}>✕</button>
//       </div>

//       <button className="new-chat-btn" onClick={onNewChat}>
//         ＋ New chat
//       </button>

//       <div className="chat-list">
//         {chats.map(chat => (
//           <div key={chat.id} className="chat-row">

//             {/* Chat title / rename */}
//             {editingId === chat.id ? (
//               <input
//                 ref={renameRef}
//                 className="chat-rename-input"
//                 value={title}
//                 autoFocus
//                 onChange={(e) => setTitle(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') submitRename()
//                   if (e.key === 'Escape') setEditingId(null)
//                 }}
//               />
//             ) : (
//               <button
//                 className={`chat-item ${chat.id === activeChatId ? 'active' : ''
//                   }`}
//                 onClick={() => onSelectChat(chat.id)}
//               >
//                 {chat.pinned && <span className="pin-icon">📌</span>}
//                 {chat.title || 'New chat'}
//               </button>
//             )}

//             {/* Three dots (hover only via CSS) */}
//             <button
//               className="chat-menu-trigger"
//               onClick={(e) => {
//                 e.stopPropagation()
//                 setMenuOpenId(openMenuId === chat.id ? null : chat.id)
//               }}
//             >
//               ⋮
//             </button>

//             {/* Context menu */}
//             {openMenuId === chat.id && (
//               <div className="chat-menu">
//                 <button onClick={() => startRename(chat)}>Rename</button>
//                 <button onClick={() => onPin(chat.id)}>
//                   {chat.pinned ? 'Unpin' : 'Pin'}
//                 </button>
//                 <button
//                   className="danger"
//                   onClick={() => onDelete(chat.id)}
//                 >
//                   Delete
//                 </button>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </aside>
//   )
// }

// export default ChatSidebar

