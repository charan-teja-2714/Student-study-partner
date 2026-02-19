import React, { useEffect, useState } from 'react'
import {
  getFacultyTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry
} from '../../services/timetableService'
import { getSections } from '../../services/userService'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const YEARS = [1, 2, 3, 4]

/* Convert "10:15 AM" → "10:15" (for <input type="time">) */
const to24h = (t12) => {
  if (!t12) return ''
  if (!t12.includes('AM') && !t12.includes('PM')) return t12
  const [time, period] = t12.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

/* Convert "10:15" → "10:15 AM" (for storage / display) */
const to12h = (t24) => {
  if (!t24) return ''
  if (t24.includes('AM') || t24.includes('PM')) return t24
  const [h, m] = t24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/* Sort by actual time value */
const parseTime = (t) => {
  if (!t) return 0
  const parts = t.trim().split(' ')
  let [h, m] = parts[0].split(':').map(Number)
  const period = parts[1]?.toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + (m || 0)
}

const EMPTY_FORM = { subject: '', year: '', section: '', day: '', time: '' }

const FacultyTimetable = () => {
  const profile = JSON.parse(sessionStorage.getItem('userProfile') || '{}')
  const facultyUid = profile.firebase_uid || sessionStorage.getItem('userId')
  const department = profile.department || ''

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [sections, setSections] = useState([])
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadEntries() }, [])

  useEffect(() => {
    if (department && formData.year) {
      getSections(department, parseInt(formData.year))
        .then(setSections)
        .catch(() => setSections([]))
    } else {
      setSections([])
    }
  }, [department, formData.year])

  const loadEntries = async () => {
    try {
      const data = await getFacultyTimetable(facultyUid)
      setEntries(data)
    } catch (err) {
      console.error('Failed to load timetable:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditEntry(null)
    setFormData(EMPTY_FORM)
    setShowModal(true)
  }

  const openEditModal = (entry) => {
    setEditEntry(entry)
    setFormData({
      subject: entry.subject,
      year: String(entry.year),
      section: entry.section,
      day: entry.day,
      time: entry.time
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditEntry(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.subject || !formData.year || !formData.section || !formData.day || !formData.time) return
    setSubmitting(true)
    try {
      if (editEntry) {
        await updateTimetableEntry(editEntry.id, {
          subject: formData.subject,
          year: parseInt(formData.year),
          section: formData.section,
          day: formData.day,
          time: formData.time
        })
      } else {
        await createTimetableEntry({
          faculty_uid: facultyUid,
          subject: formData.subject,
          department,
          year: parseInt(formData.year),
          section: formData.section,
          day: formData.day,
          time: formData.time
        })
      }
      closeModal()
      loadEntries()
    } catch (err) {
      console.error('Failed to save entry:', err)
    }
    setSubmitting(false)
  }

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this timetable entry?')) return
    try {
      await deleteTimetableEntry(entryId)
      loadEntries()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Group entries by day
  const grouped = {}
  DAYS.forEach(day => { grouped[day] = entries.filter(e => e.day === day) })

  return (
    <div className="ft-root">
      <div className="ft-header">
        <div>
          <h2 className="ft-title">Manage Timetable</h2>
          {department && <p className="ft-dept">Department: {department}</p>}
        </div>
        <button className="ft-add-btn" onClick={openAddModal}>
          + Add Class
        </button>
      </div>

      {loading ? (
        <div className="ft-loading">Loading timetable...</div>
      ) : entries.length === 0 ? (
        <div className="ft-empty">
          <div className="ft-empty-icon">📅</div>
          <h3>No classes scheduled</h3>
          <p>Click "+ Add Class" to add your first timetable entry.</p>
          <button className="ft-add-btn" onClick={openAddModal}>+ Add Class</button>
        </div>
      ) : (
        <div className="ft-table-wrapper">
          <table className="ft-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Year</th>
                <th>Section</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day =>
                grouped[day].length > 0 &&
                grouped[day]
                  .sort((a, b) => parseTime(a.time) - parseTime(b.time))
                  .map((entry, idx) => (
                    <tr key={entry.id} className={idx === 0 ? 'day-first-row' : ''}>
                      {idx === 0 && (
                        <td rowSpan={grouped[day].length} className="ft-day-cell">
                          <span className="ft-day-badge">{day}</span>
                        </td>
                      )}
                      <td className="ft-time">{entry.time}</td>
                      <td className="ft-subject">{entry.subject}</td>
                      <td>Year {entry.year}</td>
                      <td>
                        <span className="ft-section-tag">{entry.section}</span>
                      </td>
                      <td className="ft-actions">
                        <button className="ft-btn ft-edit" onClick={() => openEditModal(entry)}>
                          Edit
                        </button>
                        <button className="ft-btn ft-delete" onClick={() => handleDelete(entry.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="ft-modal-overlay" onClick={closeModal}>
          <div className="ft-modal" onClick={e => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h3>{editEntry ? 'Edit Class' : 'Add New Class'}</h3>
              <button className="ft-modal-close" onClick={closeModal}>✕</button>
            </div>

            <form className="ft-form" onSubmit={handleSubmit}>
              <div className="ft-form-row">
                <label className="ft-label">Subject Name *</label>
                <input
                  type="text"
                  className="ft-input"
                  placeholder="e.g. Mathematics, Physics"
                  value={formData.subject}
                  onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  required
                />
              </div>

              <div className="ft-form-cols">
                <div className="ft-form-row">
                  <label className="ft-label">Year *</label>
                  <select
                    className="ft-input"
                    value={formData.year}
                    onChange={e => setFormData(p => ({ ...p, year: e.target.value, section: '' }))}
                    required
                  >
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>

                <div className="ft-form-row">
                  <label className="ft-label">Section *</label>
                  {sections.length > 0 ? (
                    <select
                      className="ft-input"
                      value={formData.section}
                      onChange={e => setFormData(p => ({ ...p, section: e.target.value }))}
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.section_name}>{s.section_name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="ft-input"
                      placeholder="e.g. A, B, C"
                      value={formData.section}
                      onChange={e => setFormData(p => ({ ...p, section: e.target.value }))}
                      required
                    />
                  )}
                </div>
              </div>

              <div className="ft-form-cols">
                <div className="ft-form-row">
                  <label className="ft-label">Day *</label>
                  <select
                    className="ft-input"
                    value={formData.day}
                    onChange={e => setFormData(p => ({ ...p, day: e.target.value }))}
                    required
                  >
                    <option value="">Select Day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="ft-form-row">
                  <label className="ft-label">Time *</label>
                  <input
                    type="time"
                    className="ft-input"
                    value={to24h(formData.time)}
                    onChange={e => setFormData(p => ({ ...p, time: to12h(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="ft-form-actions">
                <button type="button" className="ft-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ft-save-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : (editEntry ? 'Update Class' : 'Add Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ft-root { padding: 24px 0; }
        .ft-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .ft-title { color: #1e3c72; margin: 0; font-size: 22px; }
        .ft-dept { color: #888; font-size: 13px; margin: 4px 0 0; }
        .ft-add-btn {
          padding: 10px 20px;
          background: #1e3c72;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .ft-add-btn:hover { background: #2a52a8; }
        .ft-loading, .ft-empty {
          text-align: center;
          padding: 60px 20px;
          color: #888;
        }
        .ft-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .ft-empty h3 { color: #555; margin: 0 0 8px; }
        .ft-empty p { margin: 0 0 20px; }
        .ft-table-wrapper {
          background: white;
          border-radius: 12px;
          overflow-x: auto;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .ft-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }
        .ft-table th {
          background: #f0f4ff;
          padding: 14px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 700;
          color: #1e3c72;
          border-bottom: 2px solid #e0e8ff;
        }
        .ft-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          color: #333;
          vertical-align: middle;
        }
        .ft-day-cell {
          background: #f8fbff;
          font-weight: 700;
          vertical-align: top !important;
          padding-top: 16px !important;
          border-right: 2px solid #e0e8ff;
        }
        .ft-day-badge {
          display: inline-block;
          background: #1e3c72;
          color: white;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .ft-time { color: #666; font-size: 13px; }
        .ft-subject { font-weight: 600; color: #1a1a2e; }
        .ft-section-tag {
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 6px;
          padding: 3px 10px;
          font-size: 12px;
          font-weight: 600;
        }
        .ft-actions { display: flex; gap: 8px; }
        .ft-btn {
          padding: 5px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .ft-edit {
          background: #e3f2fd;
          color: #1565c0;
        }
        .ft-edit:hover { background: #bbdefb; }
        .ft-delete {
          background: #fde8e8;
          color: #c62828;
        }
        .ft-delete:hover { background: #ffcdd2; }
        /* Modal */
        .ft-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .ft-modal {
          background: white;
          border-radius: 16px;
          width: 520px;
          max-width: 95vw;
          padding: 28px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.2);
        }
        .ft-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .ft-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #1e3c72;
          font-weight: 700;
        }
        .ft-modal-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #888;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .ft-modal-close:hover { background: #f0f0f0; }
        .ft-form { display: flex; flex-direction: column; gap: 18px; }
        .ft-form-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .ft-form-row { display: flex; flex-direction: column; gap: 8px; }
        .ft-label {
          font-size: 13px;
          font-weight: 700;
          color: #444;
        }
        .ft-input {
          border: 1.5px solid #ddd;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s;
          background: white;
        }
        .ft-input:focus { border-color: #1e3c72; }
        .ft-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }
        .ft-cancel-btn {
          padding: 10px 22px;
          border: 1.5px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          color: #555;
        }
        .ft-cancel-btn:hover { background: #f5f5f5; }
        .ft-save-btn {
          padding: 10px 22px;
          border: none;
          border-radius: 8px;
          background: #1e3c72;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
        }
        .ft-save-btn:hover { background: #2a52a8; }
        .ft-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 600px) {
          .ft-form-cols { grid-template-columns: 1fr; }
          .ft-modal { padding: 20px; }
          .ft-header { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </div>
  )
}

export default FacultyTimetable
