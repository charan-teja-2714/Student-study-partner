import React, { useState, useEffect } from "react"

const API_BASE = "http://127.0.0.1:8000"
const YEARS = [1, 2, 3, 4]

export default function FacultySettings() {
  const profile = JSON.parse(sessionStorage.getItem("userProfile") || "{}")
  const department = profile.department || ""
  const facultyUid = profile.firebase_uid || ""

  const [subjects, setSubjects] = useState([])
  const [sections, setSections] = useState([])

  const [newSubjectName, setNewSubjectName] = useState("")
  const [newSubjectYear, setNewSubjectYear] = useState("")
  const [newSectionName, setNewSectionName] = useState("")
  const [newSectionYear, setNewSectionYear] = useState("")

  const [activeYear, setActiveYear] = useState(1)
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    if (!department) return
    const subUrl = `${API_BASE}/subjects?department=${encodeURIComponent(department)}${facultyUid ? `&faculty_uid=${encodeURIComponent(facultyUid)}` : ""}`
    const [subRes, secRes] = await Promise.all([
      fetch(subUrl),
      fetch(`${API_BASE}/sections?department=${encodeURIComponent(department)}`)
    ])
    setSubjects(await subRes.json())
    setSections(await secRes.json())
  }

  useEffect(() => { fetchAll() }, [department])

  const addSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectYear) return
    setSaving(true)
    try {
      await fetch(`${API_BASE}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName.trim(), department, year: parseInt(newSubjectYear), faculty_uid: facultyUid || null })
      })
      setNewSubjectName("")
      setNewSubjectYear("")
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const deleteSubject = async (id) => {
    await fetch(`${API_BASE}/subjects/${id}`, { method: "DELETE" })
    await fetchAll()
  }

  const addSection = async () => {
    if (!newSectionName.trim() || !newSectionYear) return
    setSaving(true)
    try {
      await fetch(`${API_BASE}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_name: newSectionName.trim(), department, year: parseInt(newSectionYear) })
      })
      setNewSectionName("")
      setNewSectionYear("")
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (id) => {
    await fetch(`${API_BASE}/sections/${id}`, { method: "DELETE" })
    await fetchAll()
  }

  const yearSubjects = subjects.filter(s => s.year === activeYear)
  const yearSections = sections.filter(s => s.year === activeYear)

  return (
    <div className="settings-root">
      <h2 className="settings-title">Settings</h2>
      {department && (
        <p className="settings-dept">Department: <strong>{department}</strong></p>
      )}

      {/* Year tabs */}
      <div className="year-tabs">
        {YEARS.map(y => (
          <button
            key={y}
            className={`year-tab ${activeYear === y ? "active" : ""}`}
            onClick={() => setActiveYear(y)}
          >
            Year {y}
          </button>
        ))}
      </div>

      <div className="settings-columns">
        {/* Subjects */}
        <div className="settings-card">
          <h3 className="settings-card-title">📚 Subjects — Year {activeYear}</h3>

          {yearSubjects.length === 0 ? (
            <p className="settings-empty">No subjects added for Year {activeYear} yet.</p>
          ) : (
            <ul className="settings-list">
              {yearSubjects.map(s => (
                <li key={s.id} className="settings-list-item">
                  <span>{s.name}</span>
                  <button className="delete-btn" onClick={() => deleteSubject(s.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}

          <div className="settings-add-row">
            <input
              className="settings-input"
              placeholder="Subject name (e.g. Data Structures)"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSubject()}
            />
            <select
              className="settings-input settings-select"
              value={newSubjectYear}
              onChange={e => setNewSubjectYear(e.target.value)}
            >
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <button
              className="add-btn"
              onClick={addSubject}
              disabled={saving || !newSubjectName.trim() || !newSubjectYear}
            >
              + Add
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="settings-card">
          <h3 className="settings-card-title">🏫 Sections — Year {activeYear}</h3>

          {yearSections.length === 0 ? (
            <p className="settings-empty">No sections added for Year {activeYear} yet.</p>
          ) : (
            <ul className="settings-list">
              {yearSections.map(s => (
                <li key={s.id} className="settings-list-item">
                  <span>{s.section_name}</span>
                  <button className="delete-btn" onClick={() => deleteSection(s.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}

          <div className="settings-add-row">
            <input
              className="settings-input"
              placeholder="Section name (e.g. A, B, CSE-A)"
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSection()}
            />
            <select
              className="settings-input settings-select"
              value={newSectionYear}
              onChange={e => setNewSectionYear(e.target.value)}
            >
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <button
              className="add-btn"
              onClick={addSection}
              disabled={saving || !newSectionName.trim() || !newSectionYear}
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .settings-root { padding: 8px 0; }
        .settings-title { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .settings-dept { font-size: 14px; color: #6b7280; margin: 0 0 24px; }

        .year-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
        .year-tab {
          padding: 7px 20px; border-radius: 8px; border: 1px solid #d1d5db;
          background: white; font-size: 14px; font-weight: 500;
          color: #374151; cursor: pointer; transition: all 0.15s;
        }
        .year-tab:hover { background: #f3f4f6; }
        .year-tab.active {
          background: #2563eb; color: white;
          border-color: #2563eb; box-shadow: 0 2px 6px rgba(37,99,235,0.25);
        }

        .settings-columns {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .settings-card {
          background: white; border-radius: 12px; padding: 20px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .settings-card-title {
          font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 0 0 14px;
        }
        .settings-empty { font-size: 13px; color: #9ca3af; margin: 0 0 16px; }

        .settings-list {
          list-style: none; padding: 0; margin: 0 0 14px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .settings-list-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 12px; background: #f8fafc;
          border: 1px solid #e5e7eb; border-radius: 8px;
          font-size: 14px; color: #1f2937;
        }
        .delete-btn {
          background: none; border: none; color: #9ca3af; cursor: pointer;
          font-size: 14px; padding: 2px 6px; border-radius: 4px;
          transition: all 0.15s;
        }
        .delete-btn:hover { color: #ef4444; background: #fef2f2; }

        .settings-add-row { display: flex; gap: 8px; align-items: center; }
        .settings-input {
          flex: 1; padding: 9px 11px; border: 1px solid #d1d5db;
          border-radius: 7px; font-size: 13px; background: white;
          outline: none; color: #111827;
        }
        .settings-input:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.12); }
        .settings-select { flex: 0 0 auto; width: 80px; }
        .add-btn {
          padding: 9px 16px; background: #2563eb; color: white;
          border: none; border-radius: 7px; font-size: 13px;
          font-weight: 500; cursor: pointer; white-space: nowrap;
          transition: background 0.15s;
        }
        .add-btn:hover:not(:disabled) { background: #1d4ed8; }
        .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 700px) {
          .settings-columns { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
