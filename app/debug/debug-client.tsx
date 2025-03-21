'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Alert, AlertDescription } from "../components/ui/alert"
import { useState } from "react"
import { apiService } from "../lib/api-service"

export default function DebugClient() {
  const [profileResponse, setProfileResponse] = useState<string>("No data yet")
  const [postsResponse, setPostsResponse] = useState<string>("No data yet")
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const profileUrl = formData.get('profileUrl') as string

    setIsLoadingProfile(true)
    try {
      const data = await apiService.getTikTokUserInfo(profileUrl)
      setProfileResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch user data')
      setProfileResponse(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }, null, 2))
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handlePostsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const profileUrl = formData.get('postsProfileUrl') as string
    const cursor = formData.get('cursor') as string || '0'
    const count = formData.get('count') as string || '10'

    setIsLoadingPosts(true)
    try {
      const response = await fetch('/api/tiktok/user/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrl,
          cursor,
          count: parseInt(count)
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts')
      }
      setPostsResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch posts')
      setPostsResponse(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }, null, 2))
    } finally {
      setIsLoadingPosts(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">TikTok API Debug Page</h1>

      {error && (
        <Alert className="mb-6 border-red-400">
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 p-4 bg-secondary rounded-lg">
        <h2 className="font-semibold mb-2">How to use:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Enter a TikTok numeric user ID (e.g., 107955)</li>
          <li>Note: Only numeric user IDs are supported</li>
          <li>Username or profile URLs cannot be used directly</li>
          <li>Example: 107955 (TikTok's official account ID)</li>
        </ul>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Stats</TabsTrigger>
          <TabsTrigger value="posts">User Posts</TabsTrigger>
        </TabsList>

        {/* Profile Stats Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Test Profile Stats API</CardTitle>
              <CardDescription>
                Enter a TikTok numeric user ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="profileUrl">User ID</Label>
                  <Input
                    id="profileUrl"
                    name="profileUrl"
                    placeholder="Enter numeric user ID (e.g., 107955)"
                    pattern="^\d+$"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoadingProfile}>
                  {isLoadingProfile ? "Loading..." : "Fetch Profile Stats"}
                </Button>
              </form>
              <div className="mt-4">
                <Label>Response:</Label>
                <pre className="mt-2 p-4 bg-secondary rounded-lg overflow-auto max-h-96">
                  {profileResponse}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Test User Posts API</CardTitle>
              <CardDescription>
                Enter a TikTok profile URL, username, or user ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePostsSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="postsProfileUrl">Profile URL or Username</Label>
                  <Input
                    id="postsProfileUrl"
                    name="postsProfileUrl"
                    placeholder="Enter URL (e.g., https://tiktok.com/@tiktok) or username (@tiktok)"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cursor">Cursor (for pagination)</Label>
                    <Input
                      id="cursor"
                      name="cursor"
                      placeholder="0"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="count">Posts per page</Label>
                    <Input
                      id="count"
                      name="count"
                      placeholder="10"
                      type="number"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoadingPosts}>
                  {isLoadingPosts ? "Loading..." : "Fetch User Posts"}
                </Button>
              </form>
              <div className="mt-4">
                <Label>Response:</Label>
                <pre className="mt-2 p-4 bg-secondary rounded-lg overflow-auto max-h-96">
                  {postsResponse}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 