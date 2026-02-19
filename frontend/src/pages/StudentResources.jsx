import React, { useEffect, useState, useCallback } from 'react'
import Navbar from '../components/Common/Navbar'
import {
  getStudentResources,
  getResourceDownloadUrl,
  getEnrolledSubjects,
  enrollSubject,
  unenrollSubject
} from '../services/resourceService'
import { getSubjects } from '../services/userService'
import SourcePreviewModal from '../components/Chat/SourcePreviewModal'

// Build subject → chapter → files grouping
const buildGroups = (docs) => {
  const groups = {}
  docs.forEach(doc => {
    const subject = doc.subject_name || 'General'
    const chapter = doc.chapter || '__none__'
    if (!groups[subject]) groups[subject] = {}
    if (!groups[subject][chapter]) groups[subject][chapter] = []
    groups[subject][chapter].push(doc)
  })
  return groups
}

const StudentResources = () => {
  const [resources, setResources] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [enrolledIds, setEnrolledIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [showEnrollPanel, setShowEnrollPanel] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [expanded, setExpanded] = useState({})

  const firebaseUid = sessionStorage.getItem('userId')
  const profile = JSON.parse(sessionStorage.getItem('userProfile') || '{}')

  const loadAll = useCallback(async () => {
    if (!firebaseUid) return
    setLoading(true)
    try {
      const [docs, enrolled] = await Promise.all([
        getStudentResources(firebaseUid),
        getEnrolledSubjects(firebaseUid)
      ])
      setResources(docs)
      setEnrolledIds(new Set(enrolled.map(s => s.id)))
    } catch (err) {
      console.error('Failed to load resources:', err)
    } finally {
      setLoading(false)
    }
  }, [firebaseUid])

  useEffect(() => { loadAll() }, [loadAll])

  // Load available subjects for enrollment panel
  useEffect(() => {
    if (!profile.department || !profile.year) return
    getSubjects(profile.department, profile.year)
      .then(setAvailableSubjects)
      .catch(console.error)
  }, [profile.department, profile.year])

  // Initialize all subjects as expanded when resources load
  useEffect(() => {
    const groups = buildGroups(resources)
    setExpanded(prev => {
      const next = { ...prev }
      Object.keys(groups).forEach(k => {
        if (next[k] === undefined) next[k] = true
      })
      return next
    })
  }, [resources])

  const toggleExpand = (subject) => {
    setExpanded(prev => ({ ...prev, [subject]: !prev[subject] }))
  }

  const toggleEnroll = async (subjectId) => {
    setEnrollLoading(true)
    try {
      if (enrolledIds.has(subjectId)) {
        await unenrollSubject(firebaseUid, subjectId)
        setEnrolledIds(prev => { const s = new Set(prev); s.delete(subjectId); return s })
      } else {
        await enrollSubject(firebaseUid, subjectId)
        setEnrolledIds(prev => new Set([...prev, subjectId]))
      }
      const docs = await getStudentResources(firebaseUid)
      setResources(docs)
    } catch (err) {
      console.error('Enrollment error:', err)
    } finally {
      setEnrollLoading(false)
    }
  }

  const subjectGroups = buildGroups(resources)

  const renderDocCard = (doc) => (
    <div key={doc.id} className="resource-card">
      <div className="resource-icon">📄</div>
      <div className="resource-info">
        <h4 className="resource-name">{doc.name}</h4>
        <p className="resource-meta">
          {doc.department} · Year {doc.year}{doc.section ? ` · Section ${doc.section}` : ''}
        </p>
        {doc.created_at && (
          <p className="resource-date">{new Date(doc.created_at).toLocaleDateString()}</p>
        )}
      </div>
      <div className="resource-actions">
        <button className="btn-resource" onClick={() => setPreviewDoc(doc)} title="Preview">
          👁 View
        </button>
        <a
          href={getResourceDownloadUrl(doc.id)}
          download
          className="btn-resource btn-download"
          title="Download"
        >
          ⬇ Download
        </a>
      </div>
    </div>
  )

  const renderSubjectSection = ([subject, chapters]) => {
    const totalFiles = Object.values(chapters).reduce((a, b) => a + b.length, 0)
    const isExpanded = expanded[subject] !== false
    const chapterEntries = Object.entries(chapters)
    const hasNamedChapters = chapterEntries.some(([ch]) => ch !== '__none__')

    return (
      <div key={subject} className="subject-section">
        {/* Accordion header */}
        <div
          className={`subject-section-header ${isExpanded ? 'expanded' : ''}`}
          onClick={() => toggleExpand(subject)}
        >
          <span className="subject-section-icon">📚</span>
          <span className="subject-section-name">{subject}</span>
          <span className="subject-doc-count">
            {totalFiles} file{totalFiles !== 1 ? 's' : ''}
          </span>
          <span className="accordion-chevron">{isExpanded ? '▾' : '▸'}</span>
        </div>

        {/* Collapsible content */}
        {isExpanded && (
          <div className="subject-content">
            {chapterEntries.map(([chapter, docs]) => (
              <div key={chapter} className="chapter-section">
                {hasNamedChapters && (
                  <div className="chapter-section-header">
                    <span className="chapter-section-icon">📖</span>
                    <span className="chapter-section-name">
                      {chapter === '__none__' ? 'Other Files' : chapter}
                    </span>
                    <span className="chapter-file-count">
                      {docs.length} file{docs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <div className="resources-list">
                  {docs.map(renderDocCard)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1>Resources</h1>
              <p>Course materials uploaded by your faculty</p>
            </div>
            <button
              className="enroll-toggle-btn"
              onClick={() => setShowEnrollPanel(p => !p)}
            >
              📚 {showEnrollPanel ? 'Hide' : 'Manage'} Subjects
            </button>
          </div>
        </div>

        {/* Enrollment Panel */}
        {showEnrollPanel && (
          <div className="enroll-panel">
            <h3>My Subject Subscriptions</h3>
            <p className="enroll-hint">
              Toggle subjects to show or hide their resources. Resources from your timetable are always included.
            </p>
            {availableSubjects.length === 0 ? (
              <p className="enroll-empty">No subjects available for your department and year.</p>
            ) : (
              <div className="enroll-subjects">
                {availableSubjects.map(sub => (
                  <div key={sub.id} className="enroll-subject-row">
                    <span>{sub.name}</span>
                    <button
                      className={`enroll-btn ${enrolledIds.has(sub.id) ? 'enrolled' : ''}`}
                      onClick={() => toggleEnroll(sub.id)}
                      disabled={enrollLoading}
                    >
                      {enrolledIds.has(sub.id) ? '✓ Enrolled' : '+ Enroll'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resources */}
        {loading ? (
          <div className="resources-loading">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="resources-empty">
            <div className="empty-icon">📚</div>
            <h3>No resources available</h3>
            <p>Your faculty hasn't uploaded materials yet, or you haven't enrolled in any subjects.</p>
          </div>
        ) : (
          <div className="resources-sections">
            {Object.entries(subjectGroups).map(renderSubjectSection)}
          </div>
        )}
      </div>

      {previewDoc && (
        <SourcePreviewModal
          documentName={previewDoc.name}
          pageNumber={1}
          pdfUrl={getResourceDownloadUrl(previewDoc.id)}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <style>{`
        .dashboard { min-height: 100vh; background: #f5f7fa; }
        .page-header { padding: 36px 0 20px; }
        .page-header-row {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
        }
        .page-header h1 { color: #1a1a2e; margin-bottom: 6px; font-size: 24px; }
        .page-header p { color: #666; font-size: 15px; margin: 0; }

        .enroll-toggle-btn {
          padding: 9px 18px; border: 1px solid #2563eb;
          border-radius: 8px; background: white; color: #2563eb;
          font-size: 14px; font-weight: 500; cursor: pointer;
          white-space: nowrap; transition: all 0.2s;
        }
        .enroll-toggle-btn:hover { background: #eff6ff; }

        /* Enrollment panel */
        .enroll-panel {
          background: white; border-radius: 12px;
          border: 1px solid #dbeafe; padding: 20px 24px;
          margin-bottom: 24px; box-shadow: 0 2px 8px rgba(37,99,235,0.06);
        }
        .enroll-panel h3 { margin: 0 0 6px; color: #1e3a8a; font-size: 16px; }
        .enroll-hint { color: #6b7280; font-size: 13px; margin: 0 0 16px; }
        .enroll-empty { color: #9ca3af; font-size: 14px; }
        .enroll-subjects { display: flex; flex-direction: column; gap: 8px; }
        .enroll-subject-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; background: #f8fafc;
          border-radius: 8px; border: 1px solid #e5e7eb;
          font-size: 14px; color: #374151;
        }
        .enroll-btn {
          padding: 5px 14px; border-radius: 6px; font-size: 13px;
          font-weight: 500; cursor: pointer; border: 1px solid #d1d5db;
          background: white; color: #374151; transition: all 0.2s;
        }
        .enroll-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
        .enroll-btn.enrolled { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
        .enroll-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* States */
        .resources-loading { text-align: center; padding: 60px; color: #888; font-size: 15px; }
        .resources-empty { text-align: center; padding: 80px 20px; }
        .empty-icon { font-size: 52px; margin-bottom: 16px; }
        .resources-empty h3 { color: #555; margin-bottom: 8px; font-size: 18px; }
        .resources-empty p { color: #888; font-size: 14px; }

        /* Subject sections */
        .resources-sections { padding-bottom: 48px; display: flex; flex-direction: column; gap: 14px; }
        .subject-section {
          background: white; border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        /* Accordion header */
        .subject-section-header {
          display: flex; align-items: center; gap: 10px;
          padding: 15px 20px;
          border-left: 4px solid #2563eb;
          cursor: pointer; user-select: none;
          transition: background 0.15s;
        }
        .subject-section-header:hover { background: #f5f9ff; }
        .subject-section-header.expanded { background: #f0f7ff; }
        .subject-section-icon { font-size: 18px; }
        .subject-section-name { font-size: 15px; font-weight: 700; color: #1e3a8a; flex: 1; }
        .subject-doc-count {
          font-size: 12px; color: #6b7280;
          background: #f3f4f6; padding: 3px 10px; border-radius: 12px;
        }
        .accordion-chevron { font-size: 13px; color: #9ca3af; margin-left: 4px; }

        /* Chapter section */
        .subject-content { padding: 8px 0 8px; border-top: 1px solid #f0f0f0; }
        .chapter-section { margin-bottom: 6px; }
        .chapter-section-header {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 24px;
          font-size: 13px; font-weight: 600; color: #374151;
          background: #fafafa; border-bottom: 1px solid #f0f0f0;
        }
        .chapter-section-icon { font-size: 15px; }
        .chapter-section-name { flex: 1; }
        .chapter-file-count {
          font-size: 11px; color: #9ca3af; font-weight: 400;
          background: #f3f4f6; padding: 2px 8px; border-radius: 8px;
        }

        /* Horizontal resource cards */
        .resources-list { display: flex; flex-direction: column; padding: 6px 12px; gap: 4px; }
        .resource-card {
          display: flex; align-items: center; gap: 14px;
          padding: 11px 14px; border-radius: 8px;
          background: #fafafa; border: 1px solid #f0f0f0;
          transition: all 0.15s; cursor: default;
        }
        .resource-card:hover { background: #f0f7ff; border-color: #bfdbfe; }
        .resource-icon { font-size: 22px; flex-shrink: 0; }
        .resource-info { flex: 1; min-width: 0; }
        .resource-name {
          font-size: 14px; font-weight: 600; color: #1f2937;
          margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .resource-meta { font-size: 12px; color: #888; margin: 0; }
        .resource-date { font-size: 11px; color: #bbb; margin: 2px 0 0; }
        .resource-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .btn-resource {
          padding: 6px 12px; border: 1px solid #e0e0e0; border-radius: 6px;
          background: white; cursor: pointer; font-size: 12px; color: #555;
          text-decoration: none; text-align: center; transition: all 0.15s;
          white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;
        }
        .btn-resource:hover { background: #f0f8ff; border-color: #4a90e2; color: #4a90e2; }
        .btn-download:hover { background: #f0fff4; border-color: #22c55e; color: #16a34a; }

        @media (max-width: 768px) {
          .page-header-row { flex-direction: column; }
          .resource-card { flex-wrap: wrap; }
          .resource-actions { width: 100%; justify-content: flex-end; }
        }
      `}</style>
    </div>
  )
}

export default StudentResources
