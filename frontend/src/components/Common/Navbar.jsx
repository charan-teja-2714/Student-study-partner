// import React from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import UserProfile from './UserProfile'

// const Navbar = () => {
//   const navigate = useNavigate()
//   const location = useLocation()
//   const userRole = sessionStorage.getItem('userRole')

//   const handleLogout = () => {
//     sessionStorage.removeItem('userRole')
//     navigate('/login')
//   }

//   const getNavItems = () => {
//     if (userRole === 'student') {
//       return [
//         { path: '/student', label: 'Chat', icon: '💬' },
//         { path: '/notifications', label: 'Notifications', icon: '🔔' },
//         { path: '/timetable', label: 'Timetable', icon: '📅' }
//       ]
//     } else {
//       return [
//         { path: '/faculty', label: 'Upload', icon: '📁' },
//         { path: '/notifications', label: 'Notifications', icon: '🔔' },
//         { path: '/timetable', label: 'Timetable', icon: '📅' }
//       ]
//     }
//   }

//   return (
//     <nav className="navbar">
//       <div className="container">
//         <div className="nav-content">
//           <div className="nav-brand">
//             <h2>Academic Assistant</h2>
//             <span className="role-badge">{userRole}</span>
//           </div>

//           <div className="nav-links">
//             {getNavItems().map(item => (
//               <button
//                 key={item.path}
//                 className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
//                 onClick={() => navigate(item.path)}
//               >
//                 <span className="nav-icon">{item.icon}</span>
//                 {item.label}
//               </button>
//             ))}
//           </div>

//           <UserProfile />
//         </div>
//       </div>

//       <style jsx>{`
//         .navbar {
//           background: white;
//           box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
//           position: sticky;
//           top: 0;
//           z-index: 100;
//         }

//         .nav-content {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 16px 0;
//         }

//         .nav-brand {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//         }

//         .nav-brand h2 {
//           color: #333;
//           font-size: 20px;
//         }

//         .role-badge {
//           background: #007bff;
//           color: white;
//           padding: 4px 12px;
//           border-radius: 16px;
//           font-size: 12px;
//           text-transform: capitalize;
//         }

//         .nav-links {
//           display: flex;
//           gap: 8px;
//         }

//         .nav-link {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           padding: 8px 16px;
//           background: none;
//           border: none;
//           border-radius: 8px;
//           cursor: pointer;
//           color: #666;
//           font-size: 14px;
//           transition: all 0.2s;
//         }

//         .nav-link:hover {
//           background: #f8f9fa;
//           color: #333;
//         }

//         .nav-link.active {
//           background: #e3f2fd;
//           color: #007bff;
//         }

//         .nav-icon {
//           font-size: 16px;
//         }

//         @media (max-width: 768px) {
//           .nav-content {
//             padding: 12px 0;
//           }

//           .nav-brand h2 {
//             font-size: 18px;
//           }

//           .role-badge {
//             font-size: 11px;
//             padding: 3px 8px;
//           }

//           .nav-links {
//             gap: 4px;
//           }

//           .nav-link {
//             padding: 6px 12px;
//             font-size: 13px;
//           }

//           .nav-icon {
//             font-size: 14px;
//           }
//         }

//         @media (max-width: 576px) {
//           .nav-content {
//             flex-wrap: wrap;
//             gap: 12px;
//           }

//           .nav-brand {
//             flex: 1;
//             min-width: 200px;
//           }

//           .nav-links {
//             order: 3;
//             width: 100%;
//             justify-content: center;
//             background: #f8f9fa;
//             padding: 8px;
//             border-radius: 8px;
//             margin-top: 8px;
//           }

//           .nav-link {
//             flex: 1;
//             text-align: center;
//             padding: 8px 4px;
//             font-size: 12px;
//           }

//           .nav-link span {
//             display: block;
//             margin-bottom: 2px;
//           }
//         }
//       `}</style>
//     </nav>
//   )
// }

// export default Navbar


import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import UserProfile from './UserProfile'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = sessionStorage.getItem('userRole')
  const [menuOpen, setMenuOpen] = useState(false)

  const getNavItems = () => {
    if (userRole === 'student') {
      return [
        { path: '/student', label: 'Chat', icon: '💬' },
        { path: '/student/resources', label: 'Resources', icon: '📚' },
        { path: '/timetable', label: 'Timetable', icon: '📅' }
      ]
    } else {
      return [
        { path: '/faculty', label: 'Dashboard', icon: '📁' },
        { path: '/timetable', label: 'Timetable', icon: '📅' }
      ]
    }
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">

          {/* LEFT: Role / Brand */}
          <div className="nav-left">
            <span className="role-badge">{userRole}</span>
          </div>

          {/* CENTER: Navigation links */}
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {getNavItems().map(item => (
              <button
                key={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path)
                  setMenuOpen(false)
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* RIGHT: Hamburger + User Profile */}
          <div className="nav-right">
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>

            <UserProfile />
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar

