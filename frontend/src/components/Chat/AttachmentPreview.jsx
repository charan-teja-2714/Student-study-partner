import React from 'react'
import './attachmentPreview.css'

const AttachmentPreview = ({ file, onRemove }) => {
  if (!file) return null

  const isImage = file.type.startsWith('image')

  return (
    <div className="attachment-preview">
      {isImage ? (
        <img
          src={URL.createObjectURL(file)}
          alt="preview"
        />
      ) : (
        <div className="file-preview">
          📄 {file.name}
        </div>
      )}

      <button
        className="remove-attachment"
        onClick={onRemove}
      >
        ✕
      </button>
    </div>
  )
}

export default AttachmentPreview
