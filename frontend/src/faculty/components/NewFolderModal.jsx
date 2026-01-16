import React, { useState } from "react"

export default function NewFolderModal({ open, onClose, onCreate }) {
  const [folderName, setFolderName] = useState("")

  if (!open) return null

  const handleCreate = () => {
    if (!folderName.trim()) {
      alert("Folder name cannot be empty")
      return
    }

    onCreate(folderName.trim())
    setFolderName("")
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 className="modal-title">New Folder</h3>

        <div className="modal-body">
          <input
            className="input-field"
            type="text"
            placeholder="Enter folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
