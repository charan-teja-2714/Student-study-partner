import React from 'react'
import './DeleteConfirmDialog.css'

const DeleteConfirmDialog = ({ isOpen, itemName, itemType, onConfirm, onCancel }) => {
  if (!isOpen) return null

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <div className="dialog-header">
          <h3>Delete {itemType}</h3>
        </div>
        
        <div className="dialog-content">
          <p>Are you sure you want to delete <strong>"{itemName}"</strong>?</p>
          {itemType === 'folder' && (
            <p className="warning-text">This will also delete all files inside this folder.</p>
          )}
        </div>
        
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmDialog