"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { applyActionCode } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const mode = searchParams.get("mode")
  const oobCode = searchParams.get("oobCode")
  const email = searchParams.get("email") || ""
  const continueUrl = searchParams.get("continueUrl") || "/dashboard"

  useEffect(() => {
    const verifyEmail = async () => {
      if (!oobCode) {
        setError("Invalid verification link")
        setVerifying(false)
        return
      }

      try {
        if (mode === "verifyEmail") {
          // Handle email verification
          await applyActionCode(auth, oobCode)

          // Update user document to mark email as verified
          if (auth.currentUser) {
            await setDoc(
              doc(db, "users", auth.currentUser.uid),
              {
                isEmailVerified: true,
              },
              { merge: true },
            )
          }

          setSuccess(true)
        } else if (mode === "resetPassword") {
          // Redirect to reset password page with the code
          router.push(`/reset-password-confirm?oobCode=${oobCode}`)
          return
        } else {
          setError("Invalid action mode")
        }
      } catch (error) {
        console.error("Error verifying email:", error)
        if (error.code === "auth/invalid-action-code") {
          setError("The verification link has expired or already been used")
        } else {
          setError("Failed to verify email. Please try again.")
        }
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [oobCode, mode, router])

  const handleContinue = async () => {
    try {
      // If user is already signed in, just redirect
      if (auth.currentUser) {
        router.push(continueUrl)
        return
      }

      // Otherwise, redirect to sign in
      router.push("/sign-in")
    } catch (error) {
      console.error("Error during redirect:", error)
      setError("Failed to redirect. Please try signing in manually.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {verifying
              ? "Verifying your email..."
              : success
                ? "Your email has been verified!"
                : "Email verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifying ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : success ? (
            <Alert className="bg-green-500/10 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your email has been verified successfully. You can now sign in to your account.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {!verifying && (
            <Button className="w-full" onClick={handleContinue}>
              {success ? "Continue to Dashboard" : "Back to Sign In"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

