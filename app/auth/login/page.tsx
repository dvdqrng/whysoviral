"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { dynamic } from './dynamic'

// Helper function to validate internal paths
const isValidInternalPath = (path: string): boolean => {
  // Ensure path starts with a slash and doesn't contain protocol or domain indicators
  return path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes(':') &&
    !path.includes('\\');
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sanitize redirectTo parameter
  const rawRedirectTo = searchParams.get('redirectTo')
  const redirectTo = rawRedirectTo && isValidInternalPath(rawRedirectTo)
    ? rawRedirectTo
    : '/'

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        console.log("User already logged in, redirecting...")
        router.push(redirectTo)
      }
    }

    checkSession()
  }, [redirectTo, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      // Debug logging
      console.log("Attempting login with email:", email)

      // Perform login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error)
        throw error
      }

      console.log("Login successful:", data.user?.id)

      // Force a short delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify the session was created
      const { data: sessionData } = await supabase.auth.getSession()
      console.log("Session after login:", sessionData.session ? "Present" : "Missing")

      if (sessionData.session) {
        console.log("Session user ID:", sessionData.session.user.id)
        console.log("Session expires at:", sessionData.session.expires_at ?
          new Date(sessionData.session.expires_at * 1000).toISOString() : 'unknown')

        // Sync session with server
        try {
          const response = await fetch('/api/auth/session-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              session_token: JSON.stringify(sessionData.session)
            })
          })

          if (!response.ok) {
            console.warn("Failed to sync session with server:", await response.text())
          } else {
            console.log("Session synced with server")
          }
        } catch (syncError) {
          console.error("Error syncing session:", syncError)
        }
      } else {
        console.warn("Session not found after login, retrying verification...")
        // Wait a bit longer and try again
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: retryData } = await supabase.auth.getSession()
        console.log("Session after retry:", retryData.session ? "Present" : "Missing")

        if (!retryData.session) {
          // Try to get cookies to see what's going on
          document.cookie.split(';').forEach(cookie => {
            console.log("Cookie found:", cookie.trim())
          })
        }
      }

      // Navigate to home page with refresh to ensure server revalidation
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      setError(error.message || "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Sign In"}
            </Button>
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

