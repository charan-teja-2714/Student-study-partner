import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider, githubProvider } from '../firebase/config'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      // Keep userId in sync with Firebase UID on every auth state change
      if (user) {
        sessionStorage.setItem('userId', user.uid)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider)
  }

  const loginWithGithub = () => {
    return signInWithPopup(auth, githubProvider)
  }

  const logout = async () => {
    try {
      await signOut(auth)
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('userId')
      window.location.href = '/login' // Force redirect
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    user,
    signup,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}