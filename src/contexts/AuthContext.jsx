import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          setUserProfile(snap.exists() ? snap.data() : null)
        } catch {
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signIn(studentId, password) {
    const email = `${studentId}@campusvoice.app`
    const cred  = await signInWithEmailAndPassword(auth, email, password)
    const snap  = await getDoc(doc(db, 'users', cred.user.uid))
    const profile = snap.exists() ? snap.data() : null
    setUserProfile(profile)
    return { user: cred.user, profile }
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
