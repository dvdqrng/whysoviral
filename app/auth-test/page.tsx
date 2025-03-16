'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import supabase from '@/lib/supabase'

export default function AuthTestPage() {
  const [clientAuth, setClientAuth] = useState<any>(null)
  const [apiAuth, setApiAuth] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check client-side auth status
  useEffect(() => {
    async function checkClientAuth() {
      try {
        const { data, error } = await supabase.auth.getSession()

        setClientAuth({
          authenticated: !!data.session,
          error: error?.message,
          user: data.session?.user || null
        })
      } catch (err) {
        console.error('Error checking client auth:', err)
        setClientAuth({
          authenticated: false,
          error: err instanceof Error ? err.message : String(err),
          user: null
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkClientAuth()
  }, [])

  // Check API auth status
  const checkApiAuth = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      const data = await response.json()
      setApiAuth(data)
    } catch (err) {
      console.error('Error checking API auth:', err)
      setApiAuth({
        authenticated: false,
        error: err instanceof Error ? err.message : String(err),
        user: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkApiAuth()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client-side auth status */}
        <Card>
          <CardHeader>
            <CardTitle>Client-side Authentication</CardTitle>
            <CardDescription>
              Status of authentication in the browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Checking client-side authentication...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={clientAuth?.authenticated ? 'text-green-500' : 'text-red-500'}>
                    {clientAuth?.authenticated ? 'Authenticated' : 'Not authenticated'}
                  </span>
                </div>

                {clientAuth?.error && (
                  <div>
                    <strong>Error:</strong> <span className="text-red-500">{clientAuth.error}</span>
                  </div>
                )}

                {clientAuth?.user && (
                  <div>
                    <strong>User ID:</strong> {clientAuth.user.id}<br />
                    <strong>Email:</strong> {clientAuth.user.email}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardFooter>
        </Card>

        {/* API auth status */}
        <Card>
          <CardHeader>
            <CardTitle>API Authentication</CardTitle>
            <CardDescription>
              Status of authentication when calling an API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Checking API authentication...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={apiAuth?.authenticated ? 'text-green-500' : 'text-red-500'}>
                    {apiAuth?.authenticated ? 'Authenticated' : 'Not authenticated'}
                  </span>
                </div>

                {apiAuth?.error && (
                  <div>
                    <strong>Error:</strong> <span className="text-red-500">{apiAuth.error}</span>
                  </div>
                )}

                {apiAuth?.message && (
                  <div>
                    <strong>Message:</strong> {apiAuth.message}
                  </div>
                )}

                {apiAuth?.cookies && (
                  <div>
                    <strong>Cookies:</strong> {apiAuth.cookies.join(', ') || 'None'}
                  </div>
                )}

                {apiAuth?.user && (
                  <div>
                    <strong>User ID:</strong> {apiAuth.user.id}<br />
                    <strong>Email:</strong> {apiAuth.user.email}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkApiAuth}>
              Check API Auth
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Test API Endpoints</CardTitle>
            <CardDescription>
              Test different API endpoints to check authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/teams', {
                      method: 'GET',
                      credentials: 'include',
                      headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                      }
                    });
                    const data = await res.json();
                    alert(`Teams API response status: ${res.status}\n\nData: ${JSON.stringify(data, null, 2)}`);
                  } catch (err) {
                    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
                  }
                }}
                className="mr-2"
              >
                Test Teams API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 