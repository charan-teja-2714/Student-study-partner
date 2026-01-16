import React, { useState } from "react"

export default function UploadModal({ open, onClose, currentPath, onUploaded }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a PDF file")
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("path", currentPath) // 👈 IMPORTANT

      const res = await fetch("http://127.0.0.1:8000/upload/faculty", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        throw new Error("Upload failed")
      }

      setFile(null)
      onClose()

      // tell parent to refresh list
      if (onUploaded) onUploaded()
    } catch (err) {
      console.error("Upload error:", err)
      alert("Failed to upload PDF")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 className="modal-title">Upload PDF</h3>

        <div className="modal-body">
          <label className="upload-box">
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />

            <div className="upload-content">
              <div className="upload-icon">📄</div>
              <div className="upload-text">
                {file ? file.name : "Click to select a PDF file"}
              </div>
            </div>
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}
