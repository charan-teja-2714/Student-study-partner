import React from 'react'
import Navbar from '../components/Common/Navbar'
import NotificationCard from '../components/Notifications/NotificationCard'

const Notifications = () => {
  const mockNotifications = [
    {
      id: 1,
      title: 'Assignment Due Tomorrow',
      message: 'Your Data Structures assignment is due tomorrow at 11:59 PM',
      time: '2 hours ago',
      type: 'warning'
    },
    {
      id: 2,
      title: 'New Study Material Available',
      message: 'Professor Smith has uploaded new lecture notes for Computer Networks',
      time: '5 hours ago',
      type: 'info'
    },
    {
      id: 3,
      title: 'Exam Schedule Released',
      message: 'Mid-term examination schedule has been published. Check your timetable.',
      time: '1 day ago',
      type: 'info'
    },
    {
      id: 4,
      title: 'Grade Updated',
      message: 'Your grade for Database Management quiz has been updated',
      time: '2 days ago',
      type: 'success'
    }
  ]

  return (
    <div className="notifications-page">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Notifications</h1>
          <p>Stay updated with your academic activities</p>
        </div>
        
        <div className="notifications-list">
          {mockNotifications.map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .notifications-page {
          min-height: 100vh;
          background: #f5f7fa;
        }
        
        .page-header {
          text-align: center;
          padding: 40px 0 20px;
        }
        
        .page-header h1 {
          color: #333;
          margin-bottom: 8px;
        }
        
        .page-header p {
          color: #666;
          font-size: 16px;
        }
        
        .notifications-list {
          max-width: 800px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  )
}

export default Notifications