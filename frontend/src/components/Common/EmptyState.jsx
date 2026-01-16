import React from 'react'
import './EmptyState.css'

const EmptyState = ({ icon = '📝', title, message, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>

      {action && (
        <div className="empty-action">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState
