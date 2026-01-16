import React from 'react'
import './timetable.css'

const TimetableView = () => {
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ]

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const schedule = {
    'Monday': {
      '9:00 AM': { subject: 'Data Structures', duration: 2, room: 'CS-101' },
      '2:00 PM': { subject: 'Database Management', duration: 1, room: 'CS-203' },
      '3:00 PM': { subject: 'Lab - DBMS', duration: 2, room: 'Lab-1' }
    },
    'Tuesday': {
      '10:00 AM': { subject: 'Computer Networks', duration: 2, room: 'CS-102' },
      '1:00 PM': { subject: 'Software Engineering', duration: 1, room: 'CS-201' },
      '4:00 PM': { subject: 'Web Development', duration: 1, room: 'CS-301' }
    },
    'Wednesday': {
      '9:00 AM': { subject: 'Operating Systems', duration: 2, room: 'CS-103' },
      '2:00 PM': { subject: 'Data Structures', duration: 1, room: 'CS-101' },
      '3:00 PM': { subject: 'Lab - OS', duration: 2, room: 'Lab-2' }
    },
    'Thursday': {
      '10:00 AM': { subject: 'Computer Networks', duration: 1, room: 'CS-102' },
      '11:00 AM': { subject: 'Algorithm Analysis', duration: 2, room: 'CS-104' },
      '2:00 PM': { subject: 'Software Engineering', duration: 2, room: 'CS-201' }
    },
    'Friday': {
      '9:00 AM': { subject: 'Web Development', duration: 2, room: 'CS-301' },
      '1:00 PM': { subject: 'Algorithm Analysis', duration: 1, room: 'CS-104' },
      '3:00 PM': { subject: 'Project Work', duration: 2, room: 'CS-401' }
    }
  }

  const getSubjectColor = (subject) => {
    const colors = {
      'Data Structures': '#e3f2fd',
      'Database Management': '#f3e5f5',
      'Computer Networks': '#e8f5e8',
      'Software Engineering': '#fff3e0',
      'Operating Systems': '#fce4ec',
      'Algorithm Analysis': '#e0f2f1',
      'Web Development': '#f1f8e9',
      'Project Work': '#e8eaf6'
    }
    return colors[subject] || '#f5f5f5'
  }

  const renderTimeSlot = (day, time) => {
    const classInfo = schedule[day]?.[time]
    
    if (!classInfo) {
      return <div className="time-slot empty"></div>
    }

    return (
      <div 
        className="time-slot filled"
        style={{ 
          backgroundColor: getSubjectColor(classInfo.subject),
          gridRowEnd: `span ${classInfo.duration}`
        }}
      >
        <div className="class-info">
          <div className="subject-name">{classInfo.subject}</div>
          <div className="class-details">
            <span className="room">{classInfo.room}</span>
            <span className="duration">{classInfo.duration}h</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="timetable-container">
      <div className="timetable-card card">
        <div className="timetable-header">
          <h2>Weekly Timetable</h2>
          <div className="current-week">
            Week of {new Date().toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
        </div>

        <div className="timetable-grid">
          {/* Header row */}
          <div className="grid-header time-header">Time</div>
          {days.map(day => (
            <div key={day} className="grid-header day-header">{day}</div>
          ))}

          {/* Time slots */}
          {timeSlots.map(time => (
            <React.Fragment key={time}>
              <div className="time-label">{time}</div>
              {days.map(day => (
                <div key={`${day}-${time}`} className="grid-cell">
                  {renderTimeSlot(day, time)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="timetable-legend">
          <h4>Legend</h4>
          <div className="legend-items">
            {Object.keys(schedule).reduce((subjects, day) => {
              Object.values(schedule[day]).forEach(classInfo => {
                if (!subjects.includes(classInfo.subject)) {
                  subjects.push(classInfo.subject)
                }
              })
              return subjects
            }, []).map(subject => (
              <div key={subject} className="legend-item">
                <div 
                  className="legend-color"
                  style={{ backgroundColor: getSubjectColor(subject) }}
                ></div>
                <span>{subject}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimetableView