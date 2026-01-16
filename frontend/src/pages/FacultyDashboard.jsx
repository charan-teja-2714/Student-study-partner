import React from 'react'
import Navbar from '../components/Common/Navbar'
import DocumentUpload from '../components/Upload/DocumentUpload'

const FacultyDashboard = () => {
  return (
    <div className="dashboard">
      <Navbar />
      <div className="container">
        <div className="dashboard-header">
          <h1>Faculty Dashboard</h1>
          <p>Upload course materials and documents for students</p>
        </div>
        <DocumentUpload />
      </div>
      
      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f5f7fa;
        }
        
        .dashboard-header {
          text-align: center;
          padding: 40px 0 20px;
        }
        
        .dashboard-header h1 {
          color: #333;
          margin-bottom: 8px;
        }
        
        .dashboard-header p {
          color: #666;
          font-size: 16px;
        }
      `}</style>
    </div>
  )
}

export default FacultyDashboard