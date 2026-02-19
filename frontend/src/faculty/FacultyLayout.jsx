import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import FileManager from "./FileManager"
import ChatLayout from "../components/Chat/ChatLayout"
import FacultyTimetable from "../components/Timetable/FacultyTimetable"
import FacultySettings from "./FacultySettings"
import "./faculty.css"

export default function FacultyLayout() {
  const [activeTab, setActiveTab] = useState("documents")
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.clear()
    sessionStorage.clear()
    window.location.replace('/login')
  }

  return (
    <div className="faculty-root">
      {/* Sidebar */}
      <aside className="faculty-sidebar">
        <div className="faculty-sidebar-header">
          <h2>Faculty Panel</h2>
        </div>

        <nav className="faculty-nav">
          <div
            className={`faculty-nav-item ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📁 Documents
          </div>
          <div
            className={`faculty-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </div>
          <div
            className={`faculty-nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            📅 Timetable
          </div>
          <div
            className={`faculty-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </div>
        </nav>

        <div className="faculty-sidebar-footer">
          <button
            className="faculty-nav-item"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, color: '#495057' }}
            onClick={() => navigate('/student')}
          >
            👁 Student View
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="faculty-main">
        {activeTab === 'documents' && <FileManager />}
        {activeTab === 'chat' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ChatLayout />
          </div>
        )}
        {activeTab === 'timetable' && (
          <div className="container">
            <FacultyTimetable />
          </div>
        )}
        {activeTab === 'settings' && <FacultySettings />}
      </main>
    </div>
  )
}
