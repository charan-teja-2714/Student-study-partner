import React, { useState, useEffect } from "react"
import { uploadFacultyPDF } from "../../services/uploadService"
import { getSubjects, getSections } from "../../services/userService"

const YEARS = [1, 2, 3, 4]

export default function UploadModal({ open, onClose, currentPath, onUploaded, defaultYear = null, defaultSection = null }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [selectedYear, setSelectedYear] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [chapter, setChapter] = useState("")
  const [subjects, setSubjects] = useState([])
  const [sections, setSections] = useState([])

  const profile = JSON.parse(sessionStorage.getItem("userProfile") || "{}")
  const facultyDepartment = profile.department || ""
  const facultyUid = profile.firebase_uid || ""

  // Pre-fill from folder defaults each time the modal opens
  useEffect(() => {
    if (open) {
      setFile(null)
      setSelectedYear(defaultYear ? String(defaultYear) : "")
      setSelectedSection(defaultSection || "")
      setSelectedSubjectId("")
      setChapter("")
    }
  }, [open])

  useEffect(() => {
    if (facultyDepartment && selectedYear) {
      getSubjects(facultyDepartment, parseInt(selectedYear), facultyUid || undefined)
        .then(setSubjects)
        .catch(() => setSubjects([]))
      getSections(facultyDepartment, parseInt(selectedYear))
        .then(setSections)
        .catch(() => setSections([]))
    } else {
      setSubjects([])
      setSections([])
    }
  }, [facultyDepartment, selectedYear])

  if (!open) return null

  const handleSubmit = async () => {
    if (!file) { alert("Please select a PDF file"); return }
    try {
      setUploading(true)
      await uploadFacultyPDF(file, {
        faculty_uid: profile.firebase_uid || "",
        subject_id: selectedSubjectId ? parseInt(selectedSubjectId) : null,
        chapter: chapter.trim() || null,
        department: facultyDepartment,
        year: selectedYear ? parseInt(selectedYear) : null,
        section: selectedSection || null,
        path: currentPath
      })
      setFile(null)
      setSelectedYear("")
      setSelectedSection("")
      setSelectedSubjectId("")
      setChapter("")
      onClose()
      if (onUploaded) onUploaded()
    } catch (err) {
      console.error("Upload error:", err)
      alert("Failed to upload PDF")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card upload-modal-card">
        <h3 className="modal-title">Upload PDF</h3>

        <div className="modal-body">
          <label className="upload-box">
            <input type="file" accept="application/pdf" hidden onChange={(e) => setFile(e.target.files[0])} />
            <div className="upload-content">
              <div className="upload-icon">📄</div>
              <div className="upload-text">{file ? file.name : "Click to select a PDF"}</div>
            </div>
          </label>

          {/* Pre-fill hint when inside a year-tagged folder */}
          {defaultYear && (
            <p className="meta-prefill-hint">
              📁 Pre-filled from folder: Year {defaultYear}{defaultSection ? `, Section ${defaultSection}` : ""}
            </p>
          )}

          {facultyDepartment && (
            <div className="upload-metadata">
              <div className="meta-row">
                <div className="metadata-field">
                  <label>Department</label>
                  <input type="text" value={facultyDepartment} disabled className="meta-input" />
                </div>
                <div className="metadata-field">
                  <label>Year</label>
                  <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedSubjectId(""); setSelectedSection("") }} className="meta-input">
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              {selectedYear && (
                <>
                  <div className="meta-row">
                    <div className="metadata-field">
                      <label>Section <span className="meta-optional">(optional)</span></label>
                      {sections.length > 0 ? (
                        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="meta-input">
                          <option value="">All Sections</option>
                          {sections.map(s => <option key={s.id} value={s.section_name}>{s.section_name}</option>)}
                        </select>
                      ) : (
                        <input type="text" placeholder="e.g. A" value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)} className="meta-input" />
                      )}
                    </div>

                    <div className="metadata-field">
                      <label>Subject <span className="meta-optional">(optional)</span></label>
                      {subjects.length > 0 ? (
                        <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="meta-input">
                          <option value="">Select Subject</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : (
                        <p className="meta-hint">⚠ No subjects for Year {selectedYear}. Add them in ⚙️ Settings.</p>
                      )}
                    </div>
                  </div>

                  {selectedSubjectId && (
                    <div className="metadata-field">
                      <label>
                        Chapter / Topic
                        <span className="meta-optional"> (optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder='e.g. "Chapter 1", "Unit 2 – Sorting Algorithms"'
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        className="meta-input"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn primary" onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      <style>{`
        .upload-modal-card { max-height: 90vh; overflow-y: auto; width: 480px; }
        .upload-metadata { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
        .meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .metadata-field label {
          display: block; font-size: 13px; font-weight: 500;
          color: #374151; margin-bottom: 4px;
        }
        .meta-optional { font-weight: 400; color: #9ca3af; font-size: 11px; }
        .meta-input {
          width: 100%; padding: 9px 11px; border: 1px solid #d1d5db;
          border-radius: 6px; font-size: 14px; background: white;
          box-sizing: border-box; color: #111827;
        }
        .meta-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
        .meta-input:disabled { background: #f5f5f5; color: #888; }
        .meta-hint { font-size: 12px; color: #d97706; margin: 0; padding: 9px 0; }
        .meta-prefill-hint {
          font-size: 12px; color: #1d4ed8; background: #eff6ff;
          border: 1px solid #bfdbfe; border-radius: 6px;
          padding: 7px 12px; margin: 10px 0 0; margin-bottom: 0;
        }
      `}</style>
    </div>
  )
}
