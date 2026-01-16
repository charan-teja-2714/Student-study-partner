import React from 'react'

const Loader = ({ size = 'medium', text = 'Loading...' }) => {
  const getSize = () => {
    switch (size) {
      case 'small': return '20px'
      case 'large': return '40px'
      default: return '30px'
    }
  }

  return (
    <div className="loader-container">
      <div className="spinner" style={{ width: getSize(), height: getSize() }}></div>
      {text && <span className="loader-text">{text}</span>}
      
      <style>{`
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
        }
        
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loader-text {
          color: #666;
          font-size: 14px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Loader