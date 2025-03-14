"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserData {
  username: string
  email: string
  referrals: number
  earnings: number
  adsRun: number
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  authInitialized: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  authInitialized: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData)
          } else {
            console.error("User document does not exist in Firestore")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
      setAuthInitialized(true)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, userData, loading, authInitialized }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

