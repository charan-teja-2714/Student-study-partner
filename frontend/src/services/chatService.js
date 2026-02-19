import api from './api'

// Send message (JSON-based)
export const sendMessage = async ({ question, userId, sessionId, chatMode = 'rag' }) => {
  const res = await api.post('/chat', {
    question,
    user_id: userId,
    session_id: sessionId,
    chat_mode: chatMode
  })
  return res.data
}

// Get all chat sessions
export const getChatSessions = async (userId) => {
  const res = await api.get(`/chat/sessions/${userId}`)
  return Array.isArray(res.data) ? res.data : []
}

// Get messages of a session
export const getChatMessages = async (sessionId) => {
  const res = await api.get(`/chat/messages/${sessionId}`)
  return Array.isArray(res.data) ? res.data : []
}

export const renameChatSession = async (sessionId, title) => {
  return api.put(`/chat/${sessionId}/rename`, {
    title
  })
}

export const deleteChatSession = (sessionId) => {
  return api.delete(`/chat/${sessionId}`)
}

export const pinChatSession = (sessionId) =>
  api.post(`/chat/${sessionId}/pin`)

