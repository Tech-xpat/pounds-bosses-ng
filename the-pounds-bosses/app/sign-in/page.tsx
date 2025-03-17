"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import Cookies from "js-cookie"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken") || Cookies.get("auth")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    setLoading(true)

    try {
      // Set persistence to LOCAL to persist the session
      await setPersistence(auth, browserLocalPersistence)

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if email is verified
      if (!user.emailVerified) {
        // Send verification email again
        await sendEmailVerification(user)
        setError("Please verify your email before signing in. A new verification email has been sent.")
        setLoading(false)
        return
      }

      // Get ID token for server-side auth
      const idToken = await user.getIdToken()

      // Store token in both localStorage and cookies for redundancy
      localStorage.setItem("authToken", idToken)
      Cookies.set("auth", idToken, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      // Update last login
      await setDoc(
        doc(db, "users", user.uid),
        {
          lastLogin: new Date().toISOString(),
          isEmailVerified: true,
        },
        { merge: true },
      )

      // Check if user is admin
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data()
      const isAdmin = userData?.isAdmin || false

      // Set redirecting state to show loading
      setRedirecting(true)

      // Redirect based on user role with a slight delay to ensure tokens are set
      setTimeout(() => {
        if (isAdmin) {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }, 500)
    } catch (error) {
      console.error("Error signing in:", error)
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.")
      } else {
        setError(`Failed to sign in: ${error.message}`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Enter your email and password to sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || redirecting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/reset-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || redirecting}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {redirecting && (
              <Alert className="bg-blue-500/10 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Redirecting</AlertTitle>
                <AlertDescription>Taking you to your dashboard...</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || redirecting}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : redirecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/sign-up" className="font-medium text-primary underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

