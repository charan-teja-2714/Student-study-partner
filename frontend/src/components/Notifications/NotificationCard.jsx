import React from 'react'

const NotificationCard = ({ notification }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'success': return '✅'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning': return '#fff3cd'
      case 'success': return '#d4edda'
      case 'info': return '#d1ecf1'
      default: return '#f8f9fa'
    }
  }

  return (
    <div 
      className="notification-card"
      style={{ backgroundColor: getNotificationColor(notification.type) }}
    >
      <div className="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="notification-content">
        <h4 className="notification-title">{notification.title}</h4>
        <p className="notification-message">{notification.message}</p>
        <span className="notification-time">{notification.time}</span>
      </div>
      
      <div className="notification-actions">
        <button className="action-btn">
          <span>•••</span>
        </button>
      </div>
    </div>
  )
}

export default NotificationCard