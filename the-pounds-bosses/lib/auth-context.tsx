"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User, getIdToken } from "firebase/auth"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

interface UserData {
  username: string
  email: string
  referrals: number
  earnings: number
  adsRun: number
  isAdmin?: boolean
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  authInitialized: boolean
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  authInitialized: false,
  logout: async () => {},
  refreshUserData: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)
  const router = useRouter()

  // Function to refresh user data from Firestore
  const refreshUserData = async () => {
    if (!user) return

    try {
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
  }

  // Function to handle logout
  const logout = async () => {
    try {
      await auth.signOut()
      // Clear cookies and local storage
      Cookies.remove("auth")
      localStorage.removeItem("authToken")
      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Get and store the ID token
          const token = await getIdToken(firebaseUser, true)
          localStorage.setItem("authToken", token)

          // Set a cookie for server-side auth
          Cookies.set("auth", token, {
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          })

          // Set up real-time listener for user data
          const userDocRef = doc(db, "users", firebaseUser.uid)

          // First get the initial data
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData)
          }

          // Then set up real-time updates
          const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setUserData(doc.data() as UserData)
            }
          })

          // Clean up the snapshot listener when auth state changes
          return () => unsubscribeSnapshot()
        } catch (error) {
          console.error("Error setting up auth:", error)
        }
      } else {
        // User is signed out
        setUserData(null)
        Cookies.remove("auth")
        localStorage.removeItem("authToken")
      }

      setLoading(false)
      setAuthInitialized(true)
    })

    // Clean up the auth listener on unmount
    return () => unsubscribe()
  }, [router])

  // Refresh the token periodically (every 30 minutes)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(
      async () => {
        try {
          const token = await getIdToken(user, true)
          localStorage.setItem("authToken", token)
          Cookies.set("auth", token, {
            expires: 7,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          })
        } catch (error) {
          console.error("Error refreshing token:", error)
        }
      },
      30 * 60 * 1000,
    ) // 30 minutes

    return () => clearInterval(interval)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, userData, loading, authInitialized, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

