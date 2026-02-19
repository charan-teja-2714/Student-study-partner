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
//       sessionStorage.removeItem('userRole')
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
import { saveUserProfile } from '../../services/userService'
import './UserProfile.css'

const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil',
  'Electrical', 'Information Technology', 'Chemical', 'Biotechnology',
  'AI & ML', 'AI & DS'
]
const YEARS = [1, 2, 3, 4]

const UserProfile = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { user } = useAuth()
  const profileRef = useRef(null)

  const storedProfile = JSON.parse(sessionStorage.getItem('userProfile') || '{}')
  const userRole = sessionStorage.getItem('userRole') || storedProfile.role || ''
  const firebaseUid = sessionStorage.getItem('userId') || ''

  // Students cannot change dept/year/section after initial setup
  const isStudentLocked = userRole === 'student' && !!storedProfile.department

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    display_name: storedProfile.display_name || user?.displayName || '',
    department: storedProfile.department || '',
    year: storedProfile.year ? String(storedProfile.year) : '',
    section: storedProfile.section || ''
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const getInitials = () => {
    const name = storedProfile.display_name || user?.displayName || user?.email || 'U'
    return name.charAt(0).toUpperCase()
  }

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    try {
      const updated = await saveUserProfile({
        firebase_uid: firebaseUid,
        role: userRole,
        display_name: profileForm.display_name,
        email: user?.email || storedProfile.email || '',
        department: profileForm.department || null,
        year: profileForm.year ? parseInt(profileForm.year) : null,
        section: userRole === 'student' ? (profileForm.section || null) : null
      })
      sessionStorage.setItem('userProfile', JSON.stringify(updated))
      setSaveMsg('Profile saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (err) {
      setSaveMsg('Failed to save profile.')
    }
    setSaving(false)
  }

  const openProfile = () => {
    // Refresh form from latest stored profile
    const p = JSON.parse(sessionStorage.getItem('userProfile') || '{}')
    setProfileForm({
      display_name: p.display_name || user?.displayName || '',
      department: p.department || '',
      year: p.year ? String(p.year) : '',
      section: p.section || ''
    })
    setShowDropdown(false)
    setShowProfileModal(true)
  }

  return (
    <>
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
              <div className="user-name">{storedProfile.display_name || user?.displayName || user?.email}</div>
              <div className="user-email">{user?.email}</div>
              <div className="user-role-badge">{userRole}</div>
            </div>

            <div className="dropdown-divider" />

            <button className="dropdown-item" onClick={openProfile}>
              Edit Profile
            </button>

            <div className="dropdown-divider" />

            <button
              className="dropdown-item logout"
              onClick={() => {
                sessionStorage.clear()
                sessionStorage.clear()
                window.location.replace('/login')
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Edit Profile</h3>
              <button className="profile-modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <form className="profile-form" onSubmit={handleSaveProfile}>
              <div className="profile-form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={profileForm.display_name}
                  onChange={e => setProfileForm(p => ({ ...p, display_name: e.target.value }))}
                  className="profile-input"
                  placeholder="Your name"
                />
              </div>

              <div className="profile-form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={user?.email || ''}
                  className="profile-input"
                  disabled
                  style={{ background: '#f5f5f5', color: '#999' }}
                />
              </div>

              <div className="profile-form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={userRole}
                  className="profile-input"
                  disabled
                  style={{ background: '#f5f5f5', color: '#999', textTransform: 'capitalize' }}
                />
              </div>

              <div className="profile-form-group">
                <label>
                  Department
                  {isStudentLocked && <span style={{fontSize:'11px',color:'#9ca3af',marginLeft:'6px'}}>(locked after signup)</span>}
                </label>
                <select
                  value={profileForm.department}
                  onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
                  className="profile-input"
                  disabled={isStudentLocked}
                  style={isStudentLocked ? { background: '#f5f5f5', color: '#999' } : {}}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {userRole === 'student' && (
                <>
                  <div className="profile-form-group">
                    <label>
                      Year
                      {isStudentLocked && <span style={{fontSize:'11px',color:'#9ca3af',marginLeft:'6px'}}>(locked after signup)</span>}
                    </label>
                    <select
                      value={profileForm.year}
                      onChange={e => setProfileForm(p => ({ ...p, year: e.target.value }))}
                      className="profile-input"
                      disabled={isStudentLocked}
                      style={isStudentLocked ? { background: '#f5f5f5', color: '#999' } : {}}
                    >
                      <option value="">Select Year</option>
                      {YEARS.map(y => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-form-group">
                    <label>
                      Section
                      {isStudentLocked && <span style={{fontSize:'11px',color:'#9ca3af',marginLeft:'6px'}}>(locked after signup)</span>}
                    </label>
                    <input
                      type="text"
                      value={profileForm.section}
                      onChange={e => setProfileForm(p => ({ ...p, section: e.target.value }))}
                      className="profile-input"
                      placeholder="e.g. A, B, C"
                      disabled={isStudentLocked}
                      style={isStudentLocked ? { background: '#f5f5f5', color: '#999' } : {}}
                    />
                  </div>
                </>
              )}

              {saveMsg && (
                <div className={`profile-save-msg ${saveMsg.includes('Failed') ? 'error' : 'success'}`}>
                  {saveMsg}
                </div>
              )}

              <div className="profile-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .user-role-badge {
          display: inline-block;
          margin-top: 4px;
          background: #e3f2fd;
          color: #1565c0;
          border-radius: 10px;
          font-size: 10px;
          padding: 2px 8px;
          text-transform: capitalize;
          font-weight: 600;
        }
        .profile-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
        }
        .profile-modal {
          background: white;
          border-radius: 14px;
          width: 420px;
          max-width: 95vw;
          padding: 28px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.2);
        }
        .profile-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .profile-modal-header h3 {
          font-size: 18px;
          color: #1e3c72;
          margin: 0;
          font-weight: 700;
        }
        .profile-modal-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #888;
          padding: 4px;
          border-radius: 4px;
        }
        .profile-modal-close:hover { background: #f0f0f0; }
        .profile-form { display: flex; flex-direction: column; gap: 16px; }
        .profile-form-group { display: flex; flex-direction: column; gap: 6px; }
        .profile-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #555;
        }
        .profile-input {
          border: 1.5px solid #ddd;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .profile-input:focus { border-color: #1e3c72; }
        .profile-save-msg {
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
        }
        .profile-save-msg.success { background: #d4edda; color: #155724; }
        .profile-save-msg.error { background: #f8d7da; color: #721c24; }
        .profile-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .btn-cancel {
          padding: 10px 20px;
          border: 1.5px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          color: #555;
        }
        .btn-cancel:hover { background: #f5f5f5; }
        .btn-save {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: #1e3c72;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .btn-save:hover { background: #2a52a8; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </>
  )
}

export default UserProfile
