import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { saveUserProfile, getUserProfile, getSections } from '../services/userService'

const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil',
  'Electrical', 'Information Technology', 'Chemical', 'Biotechnology',
  'AI & ML', 'AI & DS'
]

const YEARS = [1, 2, 3, 4]

const Login = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Academic fields
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')
  const [availableSections, setAvailableSections] = useState([])

  const navigate = useNavigate()
  const { signup, login, loginWithGoogle, loginWithGithub } = useAuth()

  // Load sections when department + year selected
  useEffect(() => {
    if (department && year) {
      getSections(department, parseInt(year)).then(data => {
        setAvailableSections(data)
      }).catch(() => setAvailableSections([]))
    }
  }, [department, year])

  const saveProfileAndNavigate = async (firebaseUser) => {
    const uid = firebaseUser.uid || firebaseUser.user?.uid
    sessionStorage.setItem('userRole', selectedRole)
    sessionStorage.setItem('userId', uid)

    try {
      // Try to get existing profile first (for login)
      if (!isSignup) {
        const existing = await getUserProfile(uid)
        if (existing) {
          // Role mismatch: block login and show error
          if (existing.role !== selectedRole) {
            setError(`This account is registered as "${existing.role}". Please select the correct role to continue.`)
            setLoading(false)
            return
          }
          sessionStorage.setItem('userProfile', JSON.stringify(existing))
          navigate(existing.role === 'student' ? '/student' : '/faculty')
          return
        }
      }
    } catch (e) {
      // Profile doesn't exist yet, create one
    }

    // Save profile (signup or first social login)
    const profileData = {
      firebase_uid: uid,
      role: selectedRole,
      display_name: username || firebaseUser.displayName || firebaseUser.user?.displayName || '',
      email: email || firebaseUser.email || firebaseUser.user?.email || '',
      department: department || null,
      year: year ? parseInt(year) : null,
      section: selectedRole === 'student' ? (section || null) : null
    }

    try {
      const saved = await saveUserProfile(profileData)
      sessionStorage.setItem('userProfile', JSON.stringify(saved))
    } catch (e) {
      console.error('Failed to save profile:', e)
    }

    navigate(selectedRole === 'student' ? '/student' : '/faculty')
  }

  const handleSocialLogin = async (provider) => {
    try {
      setError('')
      setLoading(true)
      let result
      if (provider === 'google') {
        result = await loginWithGoogle()
      } else {
        result = await loginWithGithub()
      }
      await saveProfileAndNavigate(result)
    } catch (error) {
      setError('Failed to log in')
    }
    setLoading(false)
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setShowAuth(true)
  }

  const handleAuth = async (e) => {
    e.preventDefault()

    if (isSignup) {
      if (!username || !email || !password || !confirmPassword) {
        setError('Please fill in all fields')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (!department) {
        setError('Please select your department')
        return
      }
      if (selectedRole === 'student' && (!year || !section)) {
        setError('Please select year and section')
        return
      }
    } else {
      if (!email || !password) {
        setError('Please fill in all fields')
        return
      }
    }

    try {
      setError('')
      setLoading(true)

      let result
      if (isSignup) {
        result = await signup(email, password)
      } else {
        result = await login(email, password)
      }

      await saveProfileAndNavigate(result)
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak')
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else {
        setError(isSignup ? 'Failed to create account' : 'Failed to log in')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card card">
        <h1 className="text-center mb-20">Academic Assistant</h1>
        <p className="text-center mb-20">Select your role to continue</p>

        {!showAuth ? (
          <div className="role-selector">
            <div
              className="role-option"
              onClick={() => handleRoleSelect('student')}
            >
              <h3>Student</h3>
              <p>Access AI-powered academic assistance</p>
            </div>

            <div
              className="role-option"
              onClick={() => handleRoleSelect('faculty')}
            >
              <h3>Faculty</h3>
              <p>Upload and manage course materials</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuth}>
            <div className="selected-role mb-20">
              <span>Selected: {selectedRole}</span>
              <button type="button" onClick={() => setShowAuth(false)} className="change-role">Change</button>
            </div>

            <div className="auth-toggle">
              <button
                type="button"
                className={`toggle-btn ${!isSignup ? "active" : ""}`}
                onClick={() => setIsSignup(false)}
              >
                Login
              </button>

              <button
                type="button"
                className={`toggle-btn ${isSignup ? "active" : ""}`}
                onClick={() => setIsSignup(true)}
              >
                Sign Up
              </button>
            </div>


            {error && <div className="error-message mb-20">{error}</div>}

            {isSignup && (
              <div className="form-group mb-20">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group mb-20">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group mb-20">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            {isSignup && (
              <div className="form-group mb-20">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            )}

            {isSignup && (
              <>
                <div className="form-group mb-20">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {selectedRole === 'student' && (
                  <>
                    <div className="form-group mb-20">
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="form-input"
                        required
                      >
                        <option value="">Select Year</option>
                        {YEARS.map(y => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mb-20">
                      {availableSections.length > 0 ? (
                        <select
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className="form-input"
                          required
                        >
                          <option value="">Select Section</option>
                          {availableSections.map(s => (
                            <option key={s.id} value={s.section_name}>{s.section_name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Section (e.g., A, B, C)"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className="form-input"
                          required
                        />
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="social-login mb-20">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="btn-social btn-google"
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                className="btn-social btn-github"
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (isSignup ? 'Creating Account...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
            </button>

            {!isSignup && (
              <p className="signup-link">
                Don't have an account?
                <button type="button" onClick={() => setIsSignup(true)} className="link-btn">
                  Sign up here
                </button>
              </p>
            )}
          </form>
        )}
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
        }
        
        .login-card {
          width: 100%;
          max-width: 400px;
          margin: 20px;
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        @media (max-width: 768px) {
          .login-container {
            padding: 10px;
          }
          
          .login-card {
            margin: 0;
            padding: 24px;
            width: 100%;
            max-width: none;
            border-radius: 8px;
          }
          
          .login-card h1 {
            font-size: 22px;
          }
          
          .login-card p {
            font-size: 14px;
          }
          
          .role-option {
            padding: 18px;
          }
          
          .role-option h3 {
            font-size: 16px;
          }
          
          .role-option p {
            font-size: 13px;
          }
          
          .btn-social {
            width: 45px;
            height: 45px;
          }
          
          .form-input {
            padding: 14px;
            font-size: 16px;
          }
          
          .auth-toggle {
            gap: 8px;
          }
          
          .toggle-btn {
            padding: 12px 0;
            font-size: 14px;
          }
        }
        
        @media (max-width: 480px) {
          .login-container {
            padding: 5px;
          }
          
          .login-card {
            padding: 20px;
          }
          
          .role-option {
            padding: 16px;
          }
          
          .social-login {
            gap: 12px;
          }
        }
        
        .login-card h1 {
          color: #1e3c72;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .login-card p {
          color: #5a6c7d;
          margin-bottom: 30px;
        }
        
        .role-selector {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .role-option {
          padding: 24px;
          border: 2px solid #e8f2ff;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          background: linear-gradient(145deg, #f8fbff 0%, #e8f2ff 100%);
          position: relative;
          overflow: hidden;
        }
        
        .role-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(30, 60, 114, 0.1), transparent);
          transition: left 0.5s;
        }
        
        .role-option:hover::before {
          left: 100%;
        }
        
        .role-option:hover {
          border-color: #4a90e2;
          background: linear-gradient(145deg, #ffffff 0%, #f0f8ff 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(74, 144, 226, 0.15);
        }
        
        .role-option h3 {
          margin-bottom: 8px;
          color: #1e3c72;
          font-weight: 600;
          font-size: 18px;
        }
        
        .role-option p {
          color: #5a6c7d;
          font-size: 14px;
          margin: 0;
        }
        
        .social-login {
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        
        .btn-social {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        
        .btn-social:hover {
          transform: scale(1.1);
        }
        
        .btn-google {
          background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(234, 67, 53, 0.3);
        }
        
        .btn-github {
          background: linear-gradient(135deg, #333 0%, #24292e 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(51, 51, 51, 0.3);
        }
        

        .auth-toggle {
          display: flex;
          gap: 12px;              /* spacing between buttons */
          margin-bottom: 20px;
        }

        .toggle-btn {
          flex: 1;
          padding: 10px 0;
          border-radius: 8px;
          border: 1px solid #ccc;
          background-color: #f1f1f1;
          color: #333;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .toggle-btn.active {
          background-color: #2563eb; /* blue highlight */
          color: white;
          border-color: #2563eb;
        }

        .toggle-btn:hover {
          opacity: 0.9;
        }


        
        .signup-link {
          text-align: center;
          margin-top: 15px;
          color: #5a6c7d;
          font-size: 14px;
        }
        
        .link-btn {
          background: none;
          border: none;
          color: #4a90e2;
          cursor: pointer;
          text-decoration: underline;
          margin-left: 5px;
        }
        
        .selected-role {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #e8f2ff 0%, #d1e7ff 100%);
          border-radius: 8px;
          text-transform: capitalize;
          color: #1e3c72;
          font-weight: 500;
        }
        
        .change-role {
          background: none;
          border: none;
          color: #4a90e2;
          cursor: pointer;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .error-message {
          color: #dc3545;
          text-align: center;
          padding: 10px;
          background: #f8d7da;
          border-radius: 4px;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default Login
