import React from 'react'
import Navbar from '../components/Common/Navbar'
import TimetableView from '../components/Timetable/TimetableView'
import FacultyTimetable from '../components/Timetable/FacultyTimetable'

const Timetable = () => {
  const userRole = sessionStorage.getItem('userRole')

  return (
    <div className="timetable-page">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Class Timetable</h1>
          <p>{userRole === 'faculty' ? 'Manage your class schedule' : 'Your weekly class schedule'}</p>
        </div>
        {userRole === 'faculty' ? <FacultyTimetable /> : <TimetableView />}
      </div>

      <style>{`
        .timetable-page {
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
      `}</style>
    </div>
  )
}

export default Timetable
