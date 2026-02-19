import React, { useState, useEffect } from "react"
import { getSections } from "../../services/userService"

const API_BASE = "http://127.0.0.1:8000"
const YEARS = [1, 2, 3, 4]

export default function NewFolderModal({ open, onClose, onCreate }) {
  const [folderName, setFolderName] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [sections, setSections] = useState([])

  const profile = JSON.parse(sessionStorage.getItem("userProfile") || "{}")
  const department = profile.department || ""

  useEffect(() => {
    if (department && selectedYear) {
      getSections(department, parseInt(selectedYear))
        .then(setSections)
        .catch(() => setSections([]))
    } else {
      setSections([])
      setSelectedSection("")
    }
  }, [department, selectedYear])

  if (!open) return null

  const handleCreate = () => {
    if (!folderName.trim()) {
      alert("Folder name cannot be empty")
      return
    }
    onCreate(folderName.trim(), selectedYear ? parseInt(selectedYear) : null, selectedSection || null)
    setFolderName("")
    setSelectedYear("")
    setSelectedSection("")
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ width: 400 }}>
        <h3 className="modal-title">New Folder</h3>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Folder Name</label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. Year 1 Notes, DSA Materials"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          {department && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>
                  Assign to Year
                  <span style={optStyle}> (optional)</span>
                </label>
                <select
                  className="input-field"
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(e.target.value); setSelectedSection("") }}
                >
                  <option value="">All Years</option>
                  {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Section
                  <span style={optStyle}> (optional)</span>
                </label>
                {sections.length > 0 ? (
                  <select
                    className="input-field"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    disabled={!selectedYear}
                  >
                    <option value="">All Sections</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.section_name}>{s.section_name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input-field"
                    type="text"
                    placeholder="e.g. A"
                    value={selectedSection}
                    disabled={!selectedYear}
                    onChange={(e) => setSelectedSection(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          {selectedYear && (
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
              Files uploaded into this folder will default to Year {selectedYear}
              {selectedSection ? `, Section ${selectedSection}` : ""}.
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }
const optStyle = { fontWeight: 400, color: "#9ca3af", fontSize: 11 }
