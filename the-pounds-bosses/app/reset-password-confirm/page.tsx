"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordConfirmPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const oobCode = searchParams.get("oobCode")

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError("Invalid password reset link")
        setVerifying(false)
        return
      }

      try {
        // Verify the password reset code
        const email = await verifyPasswordResetCode(auth, oobCode)
        setEmail(email)
      } catch (error) {
        console.error("Error verifying reset code:", error)
        if (error.code === "auth/invalid-action-code") {
          setError("The password reset link has expired or already been used")
        } else {
          setError("Failed to verify password reset link. Please try again.")
        }
      } finally {
        setVerifying(false)
      }
    }

    verifyCode()
  }, [oobCode])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newPassword || !confirmPassword) {
      setError("All fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!oobCode) {
      setError("Invalid password reset code")
      return
    }

    setLoading(true)

    try {
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSuccess(true)
    } catch (error) {
      console.error("Error resetting password:", error)
      if (error.code === "auth/invalid-action-code") {
        setError("The password reset link has expired or already been used")
      } else {
        setError("Failed to reset password. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Verifying your password reset link...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Password Reset Successful</CardTitle>
            <CardDescription>Your password has been reset successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-500/10 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your password has been reset successfully. You can now sign in with your new password.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/sign-in")}>
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter a new password for {email}</CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
            <div className="text-center text-sm">
              Remember your password?{" "}
              <Link href="/sign-in" className="font-medium text-primary underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

