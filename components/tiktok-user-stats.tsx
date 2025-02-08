"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export default function TikTokUserStats() {
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [postsData, setPostsData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userId.match(/^\d+$/)) {
      setError('Please enter a valid numeric user ID')
      return
    }

    setIsLoading(true)
    setError(null)
    console.log('Fetching data for user ID:', userId)

    try {
      // Fetch user info
      const userResponse = await fetch('/api/tiktok/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl: userId }),
      })

      const userData = await userResponse.json()
      console.log('User data response:', userData)
      console.log('User data structure:', {
        hasData: !!userData.data,
        hasUser: !!userData.data?.user,
        hasStats: !!userData.data?.user?.stats,
        userFields: userData.data?.user ? Object.keys(userData.data.user) : [],
        statsFields: userData.data?.user?.stats ? Object.keys(userData.data.user.stats) : []
      })

      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to fetch user data')
      }
      setProfileData(userData)

      // Fetch posts
      const postsResponse = await fetch('/api/tiktok/user/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrl: userId,
          count: 10,
          cursor: '0'
        }),
      })

      const postsData = await postsResponse.json()
      console.log('Posts data response:', postsData)
      console.log('Posts data structure:', {
        hasData: !!postsData.data,
        hasVideos: !!postsData.data?.data?.videos,
        videosLength: postsData.data?.data?.videos?.length,
        firstVideo: postsData.data?.data?.videos?.[0] ? Object.keys(postsData.data.data.videos[0]) : [],
        firstVideoSample: postsData.data?.data?.videos?.[0],
        firstVideoStats: postsData.data?.data?.videos?.[0]?.statistics || postsData.data?.data?.videos?.[0]?.stats
      })

      if (!postsResponse.ok) {
        throw new Error(postsData.error || 'Failed to fetch posts')
      }

      // Ensure we only take the first 10 posts
      const limitedPosts = {
        ...postsData,
        videos: postsData.data?.data?.videos?.slice(0, 10).map((video: any) => ({
          ...video,
          playCount: video.play_count || 0,
          diggCount: video.digg_count || 0,
          commentCount: video.comment_count || 0,
          shareCount: video.share_count || 0,
          createTime: video.create_time
        })) || []
      }
      console.log('Setting posts data with mapped stats:', limitedPosts)
      setPostsData(limitedPosts)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
      setProfileData(null)
      setPostsData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Add debug logging for render conditions
  console.log('Render state:', {
    isLoading,
    hasError: !!error,
    hasProfileData: !!profileData?.data?.data?.user,
    profileDataStructure: profileData ? {
      hasData: !!profileData.data?.data,
      hasUser: !!profileData.data?.data?.user,
      hasStats: !!profileData.data?.data?.stats
    } : null,
    hasPostsData: !!postsData?.data?.data?.videos?.length,
    postsDataStructure: postsData ? {
      hasVideos: !!postsData.data?.data?.videos,
      videosLength: postsData.data?.data?.videos?.length
    } : null
  })

  const formatNumber = (num: number) => {
    if (!num) return '0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown date'
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">TikTok Profile Analytics</h1>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Input
            placeholder="Enter TikTok User ID (e.g., 107955)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            pattern="^\d+$"
            className="max-w-md"
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Fetch Stats"}
          </Button>
        </form>

        {error && (
          <Alert className="border-red-400">
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {!isLoading && profileData?.data?.data?.user && (
        <>
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                {profileData.data.data.user.avatarThumb && (
                  <img
                    src={profileData.data.data.user.avatarThumb}
                    alt={profileData.data.data.user.nickname}
                    className="w-24 h-24 rounded-full"
                  />
                )}
                <div>
                  <CardTitle className="text-2xl">{profileData.data.data.user.nickname}</CardTitle>
                  <p className="text-muted-foreground">@{profileData.data.data.user.uniqueId}</p>
                  {profileData.data.data.user.signature && (
                    <p className="mt-2">{profileData.data.data.user.signature}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.followerCount)}</p>
                  <p className="text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.followingCount)}</p>
                  <p className="text-muted-foreground">Following</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.heart)}</p>
                  <p className="text-muted-foreground">Likes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.videoCount)}</p>
                  <p className="text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          {postsData?.data?.data?.videos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>Latest {postsData.data.data.videos.length} TikTok videos and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {postsData.data.data.videos.map((post: any) => (
                    <div key={post.video_id || post.id} className="flex gap-4 p-4 border rounded-lg">
                      {post.cover && (
                        <img
                          src={post.cover}
                          alt={post.title || 'Video thumbnail'}
                          className="w-32 h-32 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{post.title || post.desc || 'No description'}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Posted on {formatDate(post.create_time)}
                        </p>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="font-bold">{formatNumber(post.play_count || 0)}</p>
                            <p className="text-sm text-muted-foreground">Views</p>
                          </div>
                          <div>
                            <p className="font-bold">{formatNumber(post.digg_count || 0)}</p>
                            <p className="text-sm text-muted-foreground">Likes</p>
                          </div>
                          <div>
                            <p className="font-bold">{formatNumber(post.comment_count || 0)}</p>
                            <p className="text-sm text-muted-foreground">Comments</p>
                          </div>
                          <div>
                            <p className="font-bold">{formatNumber(post.share_count || 0)}</p>
                            <p className="text-sm text-muted-foreground">Shares</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

