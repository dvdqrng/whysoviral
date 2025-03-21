"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export function AddAccountAuthTest() {
  const { user, loading } = useAuth()
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)

  // Check auth status using the API
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/tiktok/auth-check', {
        credentials: 'include',
      })
      const data = await response.json()
      setAuthStatus(data)
      console.log('Auth check result:', data)
      return data
    } catch (error) {
      console.error('Error checking auth status:', error)
      setAuthStatus({ error: String(error) })
      return null
    }
  }

  // Test the TikTok user API with a sample profile
  const testAddAccount = async () => {
    try {
      const response = await fetch('/api/tiktok/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl: '@tiktok' }),
        credentials: 'include',
      })

      const data = await response.json()
      setTestResult(data)
      console.log('API test result:', data)
      return data
    } catch (error) {
      console.error('Error testing API:', error)
      setTestResult({ error: String(error) })
      return null
    }
  }

  // Log cookies to console
  const logCookies = () => {
    console.log('Current cookies:', document.cookie)

    // Check for specific auth cookies
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token'
    ]

    console.log('Auth cookie status:')
    authCookies.forEach(cookieName => {
      const cookieExists = document.cookie.split(';').some(item =>
        item.trim().startsWith(`${cookieName}=`)
      )
      console.log(`- ${cookieName}: ${cookieExists ? 'Present' : 'Missing'}`)
    })
  }

  useEffect(() => {
    // Log initial auth state
    console.log('Auth context state:', { user, loading })
  }, [user, loading])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
        <CardDescription>
          Test authentication status for TikTok account addition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Auth Context Status:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
            {loading ? 'Loading...' : user ? `Logged in as: ${user.email}` : 'Not logged in'}
          </pre>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={checkAuthStatus} variant="outline" size="sm">
            Check Auth Status
          </Button>

          <Button onClick={testAddAccount} variant="outline" size="sm">
            Test TikTok API
          </Button>

          <Button onClick={logCookies} variant="outline" size="sm">
            Log Cookies
          </Button>
        </div>

        {authStatus && (
          <div>
            <p className="text-sm font-medium mb-1">Auth Check Result:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </div>
        )}

        {testResult && (
          <div>
            <p className="text-sm font-medium mb-1">API Test Result:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 