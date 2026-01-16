import React, { useState } from 'react'

const MobileSidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`mobile-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button 
            className="close-btn"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="sidebar-content">
          {children}
        </div>
      </div>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <style jsx>{`
        .hamburger-btn {
          display: none;
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1001;
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          cursor: pointer;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }

        .hamburger-btn span {
          width: 20px;
          height: 2px;
          background: #333;
          transition: 0.3s;
        }

        .mobile-sidebar {
          position: fixed;
          top: 0;
          left: -300px;
          width: 300px;
          height: 100vh;
          background: white;
          z-index: 1000;
          transition: left 0.3s ease;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        }

        .mobile-sidebar.open {
          left: 0;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .sidebar-header h3 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .sidebar-content {
          padding: 20px;
        }

        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }

        @media (max-width: 768px) {
          .hamburger-btn {
            display: flex;
          }
        }
      `}</style>
    </>
  )
}

export default MobileSidebar