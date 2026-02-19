import React from 'react'

const SourcePreviewModal = ({ documentName, pageNumber, pdfUrl, onClose }) => {
  // Build URL with page number for PDF viewers
  const viewUrl = pdfUrl ? `${pdfUrl}#page=${pageNumber}` : null

  return (
    <div className="source-modal-overlay" onClick={onClose}>
      <div className="source-modal" onClick={(e) => e.stopPropagation()}>
        <div className="source-modal-header">
          <h3>{documentName} - Page {pageNumber}</h3>
          <button className="source-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="source-modal-body">
          {viewUrl ? (
            <iframe
              src={viewUrl}
              title={`${documentName} - Page ${pageNumber}`}
              className="pdf-iframe"
            />
          ) : (
            <div className="no-preview">
              <p>Preview not available for this document.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .source-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .source-modal {
          background: white;
          border-radius: 12px;
          width: 90vw;
          max-width: 900px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
        }
        .source-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
          flex-shrink: 0;
        }
        .source-modal-header h3 {
          font-size: 16px;
          color: #333;
          margin: 0;
        }
        .source-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #888;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .source-modal-close:hover {
          background: #f0f0f0;
          color: #333;
        }
        .source-modal-body {
          flex: 1;
          overflow: hidden;
        }
        .pdf-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .no-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #888;
        }
        @media (max-width: 768px) {
          .source-modal {
            width: 100vw;
            height: 100vh;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default SourcePreviewModal
