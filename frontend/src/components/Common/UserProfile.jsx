// import React, { useState } from 'react'
// import { useAuth } from '../../contexts/AuthContext'

// const UserProfile = () => {
//   const [showDropdown, setShowDropdown] = useState(false)
//   const { user, logout } = useAuth()

//   const getInitials = () => {
//     if (user?.displayName) {
//       return user.displayName.charAt(0).toUpperCase()
//     }
//     if (user?.email) {
//       return user.email.charAt(0).toUpperCase()
//     }
//     return 'U'
//   }

//   const handleLogout = async () => {
//     try {
//       await logout()
//       localStorage.removeItem('userRole')
//     } catch (error) {
//       console.error('Failed to logout')
//     }
//   }

//   return (
//     <div className="user-profile">
//       <div 
//         className="avatar-container"
//         onClick={() => setShowDropdown(!showDropdown)}
//       >
//         {user?.photoURL ? (
//           <img src={user.photoURL} alt="Profile" className="avatar-image" />
//         ) : (
//           <div className="avatar-initials">
//             {getInitials()}
//           </div>
//         )}
//       </div>

//       {showDropdown && (
//         <div className="dropdown-menu">
//           <div className="dropdown-item user-info">
//             <div className="user-name">{user?.displayName || user?.email}</div>
//             <div className="user-email">{user?.email}</div>
//           </div>
//           <div className="dropdown-divider"></div>
//           <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
//             Profile
//           </button>
//           <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
//             Settings
//           </button>
//           <div className="dropdown-divider"></div>
//           <button className="dropdown-item logout" onClick={handleLogout}>
//             Logout
//           </button>
//         </div>
//       )}

//       <style jsx>{`
//         .user-profile {
//           position: relative;
//         }

//         .avatar-container {
//           width: 40px;
//           height: 40px;
//           border-radius: 50%;
//           cursor: pointer;
//           overflow: hidden;
//           border: 2px solid #e9ecef;
//           transition: border-color 0.2s;
//         }

//         .avatar-container:hover {
//           border-color: #4a90e2;
//         }

//         .avatar-image {
//           width: 100%;
//           height: 100%;
//           object-fit: cover;
//         }

//         .avatar-initials {
//           width: 100%;
//           height: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: #4a90e2;
//           color: white;
//           font-weight: 600;
//           font-size: 16px;
//         }

//         .dropdown-menu {
//           position: absolute;
//           top: 50px;
//           right: 0;
//           background: white;
//           border-radius: 8px;
//           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
//           min-width: 200px;
//           z-index: 1000;
//           border: 1px solid #e9ecef;
//         }
        
//         @media (max-width: 768px) {
//           .dropdown-menu {
//             right: -5px;
//             min-width: 180px;
//             font-size: 14px;
//           }
          
//           .avatar-container {
//             width: 36px;
//             height: 36px;
//           }
          
//           .avatar-initials {
//             font-size: 14px;
//           }
          
//           .dropdown-item {
//             padding: 10px 14px;
//             font-size: 13px;
//           }
          
//           .dropdown-item.user-info {
//             padding: 12px 14px;
//           }
          
//           .user-name {
//             font-size: 13px;
//           }
          
//           .user-email {
//             font-size: 11px;
//           }
//         }

//         .dropdown-item {
//           width: 100%;
//           padding: 12px 16px;
//           border: none;
//           background: none;
//           text-align: left;
//           cursor: pointer;
//           transition: background-color 0.2s;
//           font-size: 14px;
//         }

//         .dropdown-item:hover {
//           background: #f8f9fa;
//         }

//         .dropdown-item.user-info {
//           cursor: default;
//           padding: 16px;
//         }

//         .dropdown-item.user-info:hover {
//           background: none;
//         }

//         .user-name {
//           font-weight: 600;
//           color: #333;
//           margin-bottom: 4px;
//         }

//         .user-email {
//           font-size: 12px;
//           color: #666;
//         }

//         .dropdown-divider {
//           height: 1px;
//           background: #e9ecef;
//           margin: 4px 0;
//         }

//         .dropdown-item.logout {
//           color: #dc3545;
//         }

//         .dropdown-item.logout:hover {
//           background: #f8d7da;
//         }
//       `}</style>
//     </div>
//   )
// }

// export default UserProfile

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './UserProfile.css'

const UserProfile = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const { user, logout } = useAuth()
  const profileRef = useRef(null)

  const getInitials = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem('userRole')
    } catch (error) {
      console.error('Failed to logout')
    }
  }

  /* ✅ Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="user-profile" ref={profileRef}>
      <div
        className="avatar-container"
        onClick={() => setShowDropdown(prev => !prev)}
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="avatar-image" />
        ) : (
          <div className="avatar-initials">{getInitials()}</div>
        )}
      </div>

      {showDropdown && (
        <div className="dropdown-menu" data-state="open">
          <div className="dropdown-item user-info">
            <div className="user-name">{user?.displayName || user?.email}</div>
            <div className="user-email">{user?.email}</div>
          </div>

          <div className="dropdown-divider" />

          <button className="dropdown-item">Profile</button>
          <button className="dropdown-item">Settings</button>

          <div className="dropdown-divider" />

          <button className="dropdown-item logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserProfile
