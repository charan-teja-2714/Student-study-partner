import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider, browserSessionPersistence, setPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyATJtnsPh_m_KcAo7wy7wt8WJqy0wBYFug",
  authDomain: "student-study-partner-c75df.firebaseapp.com",
  projectId: "student-study-partner-c75df",
  storageBucket: "student-study-partner-c75df.firebasestorage.app",
  messagingSenderId: "946379065264",
  appId: "1:946379065264:web:b0fd2f882ab111cec77875",
  measurementId: "G-NE5JYTGSNM"
};
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Each browser tab gets its own independent auth session.
// Survives page refresh (sessionStorage persists across F5) but tabs are isolated.
setPersistence(auth, browserSessionPersistence).catch(console.error)

export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
export default app