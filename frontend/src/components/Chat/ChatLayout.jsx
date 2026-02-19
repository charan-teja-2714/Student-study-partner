import React, { useEffect, useState } from 'react'
import ChatSidebar from './ChatSidebar'
import ChatBox from './ChatBox'
import {
    getChatSessions,
    renameChatSession,
    deleteChatSession,
    pinChatSession
} from '../../services/chatService'
import './chatLayout.css'

const ChatLayout = () => {
    const userId = sessionStorage.getItem('userId') || ''

    const [chats, setChats] = useState([])

    // Restore the last active session across page navigations
    const [activeChatId, setActiveChatId] = useState(() => {
        const saved = sessionStorage.getItem('chat_activeId')
        return saved ? parseInt(saved, 10) : null
    })

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isNewChat, setIsNewChat] = useState(false)

    // Persist activeChatId so it survives page navigation
    useEffect(() => {
        if (activeChatId && typeof activeChatId === 'number') {
            sessionStorage.setItem('chat_activeId', String(activeChatId))
        } else {
            sessionStorage.removeItem('chat_activeId')
        }
    }, [activeChatId])

    /* -------------------------------
       Load chat sessions (ONCE)
    -------------------------------- */
    useEffect(() => {
        loadChats()
        // eslint-disable-next-line
    }, [])

    const loadChats = async (keepActive = true) => {
        try {
            const data = await getChatSessions(userId)

            // pinned chats first
            const sorted = [...data].sort((a, b) => {
                if (a.pinned && !b.pinned) return -1
                if (!a.pinned && b.pinned) return 1
                return new Date(b.created_at) - new Date(a.created_at)
            })

            setChats(sorted)

            // 🔑 ONLY set active chat if none selected
            if (!keepActive && sorted.length > 0) {
                setActiveChatId(sorted[0].id)
            }
        } catch (err) {
            console.error('Failed to load chats', err)
        }
    }

    /* -------------------------------
       New chat (explicit user action)
    -------------------------------- */
    const handleNewChat = () => {
        setActiveChatId(null)     // triggers useEffect → removes from sessionStorage
        setIsSidebarOpen(false)
        setIsNewChat(true)
    }

    /* -------------------------------
       Called the moment user sends their
       first message in a new chat —
       adds a placeholder row to the sidebar
       immediately (before API responds)
    -------------------------------- */
    const handleChatStarted = () => {
        setChats(prev => {
            if (prev.some(c => c.id === 'pending')) return prev
            return [{
                id: 'pending',
                title: 'New Chat',
                created_at: new Date().toISOString(),
                pinned: false
            }, ...prev]
        })
    }



    /* -------------------------------
       Rename chat (backend + reload)
    -------------------------------- */
    const handleRenameChat = async (chatId, newTitle) => {
        try {
            await renameChatSession(chatId, newTitle)

            setChats(prev =>
                prev.map(chat =>
                    chat.id === chatId ? { ...chat, title: newTitle } : chat
                )
            )

        } catch (err) {
            console.error("Rename failed", err)
        }
    }

    /* -------------------------------
       Delete chat
    -------------------------------- */
    const handleDeleteChat = async (chatId) => {
        try {
            await deleteChatSession(chatId)

            setChats(prev => prev.filter(chat => chat.id !== chatId))

            // 🔑 If active chat was deleted
            if (chatId === activeChatId) {
                setActiveChatId(null)
            }

        } catch (err) {
            console.error('Delete failed', err)
        }
    }



    const handlePinChat = async (chatId) => {
        try {
            await pinChatSession(chatId)

            setChats(prev => {
                const updated = prev.map(chat =>
                    chat.id === chatId
                        ? { ...chat, pinned: !chat.pinned }
                        : chat
                )

                // 🔑 RE-SORT after pin toggle
                return [...updated].sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1
                    if (!a.pinned && b.pinned) return 1
                    return new Date(b.created_at) - new Date(a.created_at)
                })
            })

        } catch (err) {
            console.error("Pin failed", err)
        }
    }

    return (
        <div className="chat-layout">

            {/* Sidebar */}
            <ChatSidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(id) => {
                    setActiveChatId(id)
                    setIsSidebarOpen(false)
                }}
                onNewChat={handleNewChat}
                onRename={handleRenameChat}
                onDelete={handleDeleteChat}
                onPin={handlePinChat}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main chat area */}
            <div className="chat-main">

                {!isSidebarOpen && (
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        ☰
                    </button>
                )}

                <ChatBox
                    userId={userId}
                    activeSessionId={activeChatId}
                    isNewChat={isNewChat}
                    onChatStarted={handleChatStarted}
                    onSessionCreated={(newSessionId) => {
                        setActiveChatId(newSessionId)
                        setIsNewChat(false)
                        // Remove placeholder + reload with real title from backend
                        loadChats()
                    }}
                />

            </div>
        </div>
    )
}

export default ChatLayout

// import React, { useEffect, useState } from 'react'
// import ChatSidebar from './ChatSidebar'
// import ChatBox from './ChatBox'
// import {
//     getChatSessions,
//     renameChatSession,
//     deleteChatSession,
//     pinChatSession
// } from '../../services/chatService'
// import './chatLayout.css'

// const ChatLayout = () => {
//     const userId = Number(sessionStorage.getItem('userId')) || 1

//     const [chats, setChats] = useState([])
//     const [activeChatId, setActiveChatId] = useState(null)
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false)

//     /* -------------------------------
//        Load chat sessions
//     -------------------------------- */
//     useEffect(() => {
//         loadChats()
//         // eslint-disable-next-line
//     }, [])

//     const loadChats = async () => {
//         try {
//             const data = await getChatSessions(userId)

//             // pinned chats first
//             const sorted = [...data].sort((a, b) => {
//                 if (a.pinned && !b.pinned) return -1
//                 if (!a.pinned && b.pinned) return 1
//                 return new Date(b.created_at) - new Date(a.created_at)
//             })

//             setChats(sorted)

//             // setChats(data)
//             setActiveChatId(null) // Always start fresh

//         } catch (err) {
//             console.error('Failed to load chats', err)
//         }
//     }

//     /* -------------------------------
//        New chat
//     -------------------------------- */
//     const handleNewChat = () => {
//         setActiveChatId(null)
//         setIsSidebarOpen(false)
//     }


//     /* -------------------------------
//        Rename chat
//     -------------------------------- */
//     const handleRenameChat = async (chat) => {
//         const newTitle = prompt('Rename chat', chat.title || '')
//         if (!newTitle || !newTitle.trim()) return

//         try {
//             await renameChatSession(chat.id, newTitle.trim())
//             loadChats()
//         } catch (err) {
//             console.error('Rename failed', err)
//         }
//     }

//     /* -------------------------------
//        Delete chat
//     -------------------------------- */
//     const handleDeleteChat = async (chatId) => {
//         const confirm = window.confirm('Delete this conversation?')
//         if (!confirm) return

//         try {
//             await deleteChatSession(chatId)

//             // reset active chat if deleted
//             if (chatId === activeChatId) {
//                 setActiveChatId(null)
//             }

//             loadChats()
//         } catch (err) {
//             console.error('Delete failed', err)
//         }
//     }

//     /* -------------------------------
//        Pin / Unpin chat
//     -------------------------------- */
//     const handlePinChat = async (chatId) => {
//         try {
//             await pinChatSession(chatId)
//             loadChats()
//         } catch (err) {
//             console.error('Pin failed', err)
//         }
//     }

//     return (
//         <div className="chat-layout">

//             {/* Sidebar */}
//             <ChatSidebar
//                 chats={chats}
//                 activeChatId={activeChatId}
//                 onSelectChat={(id) => {
//                     setActiveChatId(id)
//                     setIsSidebarOpen(false)
//                 }}
//                 onNewChat={handleNewChat}

//                 onRename={(id, newTitle) => {
//                     setChats(prev =>
//                         prev.map(chat =>
//                             chat.id === id ? { ...chat, title: newTitle } : chat
//                         )
//                     )
//                 }}

//                 onDelete={(id) => {
//                     setChats(prev => prev.filter(chat => chat.id !== id))
//                     if (id === activeChatId) setActiveChatId(null)
//                 }}

//                 onPin={(id) => {
//                     setChats(prev =>
//                         prev.map(chat =>
//                             chat.id === id ? { ...chat, pinned: !chat.pinned } : chat
//                         )
//                     )
//                 }}

//                 isOpen={isSidebarOpen}
//                 onClose={() => setIsSidebarOpen(false)}
//             />

//             {/* Main chat area */}
//             <div className="chat-main">

//                 {/* Hamburger (mobile only) */}
//                 {!isSidebarOpen && (
//                     <button
//                         className="sidebar-toggle"
//                         onClick={() => setIsSidebarOpen(true)}
//                         aria-label="Open sidebar"
//                     >
//                         ☰
//                     </button>
//                 )}

//                 <ChatBox
//                     userId={userId}
//                     activeSessionId={activeChatId}
//                     onSessionCreated={(newSessionId) => {
//                         setActiveChatId(newSessionId)
//                         loadChats()
//                     }}
//                 />
//             </div>
//         </div>
//     )
// }

// export default ChatLayout
