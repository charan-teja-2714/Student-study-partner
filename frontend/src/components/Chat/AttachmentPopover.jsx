import React from 'react'
import './attachmentPopover.css'

const AttachmentPopover = ({ open, onSelect, onClose }) => {
  if (!open) return null

  return (
    <div className="attachment-popover">
      <label className="attachment-item">
        📄 Upload file
        <input
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => {
            if (e.target.files[0]) {
              onSelect(e.target.files[0])
              onClose()
            }
          }}
        />
      </label>

      <label className="attachment-item">
        🖼️ Add photo
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            if (e.target.files[0]) {
              onSelect(e.target.files[0])
              onClose()
            }
          }}
        />
      </label>
    </div>
  )
}

export default AttachmentPopover
