'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ApiTestPage() {
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testProfilesApi = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the hardcoded user ID for testing
      const userId = '721af791-fdba-4c9f-b2c5-4e59d9e9207b'
      const response = await fetch(`/api/tiktok/profiles?userId=${userId}&timeframe=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log('API Response:', data)
      setApiResponse(data)
    } catch (err) {
      console.error('Error testing API:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testAuthCheckApi = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/tiktok/auth-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log('Auth Check API Response:', data)
      setApiResponse(data)
    } catch (err) {
      console.error('Error testing auth API:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>

      <div className="mb-8">
        <Button
          onClick={testProfilesApi}
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Loading...' : 'Test TikTok Profiles API'}
        </Button>

        <Button
          onClick={testAuthCheckApi}
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Loading...' : 'Test Auth Check API'}
        </Button>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            Error: {error}
          </div>
        )}

        <div className="border p-4 rounded bg-gray-50">
          <h2 className="text-lg font-bold mb-2">API Response:</h2>
          {apiResponse ? (
            <div>
              <div className="mb-4">
                <strong>Success:</strong> {apiResponse.success ? 'Yes' : 'No'}
              </div>

              {apiResponse.data && (
                <div>
                  <strong>Number of profiles:</strong> {apiResponse.data.length}

                  <div className="mt-4">
                    <h3 className="font-bold mb-2">Profiles:</h3>
                    {apiResponse.data.map((profile: any, index: number) => (
                      <div key={index} className="mb-4 p-4 border rounded">
                        <h4 className="font-bold">Profile {index + 1}: {profile.user.username}</h4>
                        <div><strong>TikTok UID:</strong> {profile.user.tiktok_uid}</div>
                        <div><strong>Auth User ID:</strong> {profile.user.auth_user_id}</div>
                        <div><strong>Posts count:</strong> {profile.posts?.length || 0}</div>
                        <div><strong>Analytics available:</strong> {profile.analytics ? 'Yes' : 'No'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary>Raw Response</summary>
                <pre className="p-4 bg-gray-800 text-white overflow-auto mt-2 text-xs">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-gray-500">Click the button to make an API request</div>
          )}
        </div>
      </div>
    </div>
  )
} 