import React from "react"
import FileManager from "./FileManager"
import "./faculty.css"

export default function FacultyLayout() {
  return (
    <div className="faculty-root">
      {/* Sidebar */}
      <aside className="faculty-sidebar">
        <div className="faculty-sidebar-header">
          <h2>Faculty Panel</h2>
        </div>

        <nav className="faculty-nav">
          <div className="faculty-nav-item active">
            📁 Documents
          </div>

          {/* You can enable this later if needed */}
          {/* <div className="faculty-nav-item">
            📊 Dashboard
          </div> */}
        </nav>

        <div className="faculty-sidebar-footer">
          <button className="logout-btn">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="faculty-main">
        <FileManager />
      </main>
    </div>
  )
}
