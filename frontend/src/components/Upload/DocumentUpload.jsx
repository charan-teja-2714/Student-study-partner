import React, { useState, useRef } from 'react'
import { uploadStudentPDF } from '../../services/uploadService'
import Loader from '../Common/Loader'
import './upload.css'

const DocumentUpload = () => {
  const userId = 'student_001' // later replace with auth

  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const fileInputRef = useRef(null)

  const allowedTypes = ['application/pdf']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF files are allowed'
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB'
    }
    return null
  }

  const handleFiles = async (files) => {
    const file = files[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      setUploadStatus({ type: 'error', message: error })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)

    try {
      await uploadStudentPDF(file, userId)

      setUploadedFiles(prev => [
        {
          id: Date.now(),
          name: file.name,
          size: file.size,
          uploadedAt: new Date()
        },
        ...prev
      ])

      setUploadStatus({
        type: 'success',
        message: 'Document uploaded and indexed successfully'
      })
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err?.response?.data?.detail || 'Upload failed'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files)
    }
  }

  const formatFileSize = (bytes) => {
    const kb = bytes / 1024
    return kb > 1024
      ? `${(kb / 1024).toFixed(2)} MB`
      : `${kb.toFixed(2)} KB`
  }

  return (
    <div className="upload-container">
      <div className="upload-section card">
        <h2>Upload Study Materials</h2>
        <p>Upload PDFs to chat with them using AI</p>

        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader size="large" text="Uploading & indexing..." />
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <h3>Drop PDF here or click to browse</h3>
              <p>Max size: 10MB</p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </div>

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.type}`}>
            {uploadStatus.message}
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files card">
          <h3>Uploaded Files</h3>
          {uploadedFiles.map(file => (
            <div key={file.id} className="file-item">
              <span>📄 {file.name}</span>
              <span className="file-meta">
                {formatFileSize(file.size)} • {file.uploadedAt.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentUpload
