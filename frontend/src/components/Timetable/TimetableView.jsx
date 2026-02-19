import React, { useEffect, useState } from 'react'
import { getStudentTimetable } from '../../services/timetableService'
import './timetable.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const COLORS = [
  '#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0',
  '#fce4ec', '#e0f2f1', '#f1f8e9', '#e8eaf6',
  '#fff8e1', '#e1f5fe'
]

/* Parse any time string to minutes-since-midnight for sorting */
const parseTime = (t) => {
  if (!t) return 0
  const parts = t.trim().split(' ')
  const [hStr, mStr] = parts[0].split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr || '0', 10)
  const period = parts[1]?.toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + m
}

const TimetableView = () => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const firebaseUid = sessionStorage.getItem('userId')

  useEffect(() => {
    if (firebaseUid) {
      getStudentTimetable(firebaseUid)
        .then(setEntries)
        .catch(err => console.error('Failed to load timetable:', err))
        .finally(() => setLoading(false))
    }
  }, [firebaseUid])

  // Color map for subjects
  const subjectColors = {}
  const uniqueSubjects = [...new Set(entries.map(e => e.subject))]
  uniqueSubjects.forEach((sub, i) => {
    subjectColors[sub] = COLORS[i % COLORS.length]
  })

  // Build schedule lookup: schedule[day][time] = entry
  const schedule = {}
  entries.forEach(e => {
    if (!schedule[e.day]) schedule[e.day] = {}
    schedule[e.day][e.time] = e
  })

  // Derive time slots dynamically from actual entries (sorted chronologically)
  const timeSlots = [...new Set(entries.map(e => e.time))]
    .sort((a, b) => parseTime(a) - parseTime(b))

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading timetable...</div>
  }

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
        <h3 style={{ color: '#555' }}>No timetable available</h3>
        <p style={{ color: '#888' }}>Your faculty hasn't set up the timetable for your section yet.</p>
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
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </div>
        </div>

        <div className="timetable-grid">
          {/* Header row */}
          <div className="grid-header time-header">Time</div>
          {DAYS.map(day => (
            <div key={day} className="grid-header day-header">{day}</div>
          ))}

          {/* One row per unique scheduled time */}
          {timeSlots.map(time => (
            <React.Fragment key={time}>
              <div className="time-label">{time}</div>
              {DAYS.map(day => {
                const entry = schedule[day]?.[time]
                return (
                  <div key={`${day}-${time}`} className="grid-cell">
                    {entry ? (
                      <div
                        className="time-slot filled"
                        style={{ backgroundColor: subjectColors[entry.subject] || '#f5f5f5' }}
                      >
                        <div className="class-info">
                          <div className="subject-name">{entry.subject}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="time-slot empty" />
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>

        {uniqueSubjects.length > 0 && (
          <div className="timetable-legend">
            <h4>Legend</h4>
            <div className="legend-items">
              {uniqueSubjects.map(subject => (
                <div key={subject} className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: subjectColors[subject] }}
                  />
                  <span>{subject}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimetableView
