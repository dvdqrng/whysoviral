"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { apiService } from "@/lib/api-service"

interface TikTokUserStatsProps {
  username: string
  onClose: () => void
}

export default function TikTokUserStats({ username, onClose }: TikTokUserStatsProps) {
  const [userData, setUserData] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user profile data using the API service
        const profiles = await apiService.getTikTokProfiles(undefined, 1)

        const profileData = profiles.find((p: any) => p.user.username === username)
        if (profileData) {
          setUserData(profileData.user)
          setPosts(profileData.posts || [])
        } else {
          throw new Error('User not found')
        }
      } catch (err) {
        console.error('Error fetching user stats:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchUserData()
    }
  }, [username])

  const formatNumber = (num: number = 0) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Calculate total stats
  const totalViews = posts.reduce((sum, post) => sum + (post.plays || 0), 0)
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0)
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0)
  const totalShares = posts.reduce((sum, post) => sum + (post.shares || 0), 0)

  // Calculate averages
  const avgViews = posts.length ? Math.round(totalViews / posts.length) : 0
  const avgLikes = posts.length ? Math.round(totalLikes / posts.length) : 0
  const avgComments = posts.length ? Math.round(totalComments / posts.length) : 0
  const avgShares = posts.length ? Math.round(totalShares / posts.length) : 0

  return (
    <Dialog open={!!username} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {userData?.nickname || username}
            {userData?.verified && (
              <span className="h-4 w-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">@{username}</p>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            <p className="mt-2">Loading stats...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User profile summary */}
            <div className="flex gap-4">
              <img
                src={userData?.avatar || '/placeholder-avatar.jpg'}
                alt={username}
                className="h-20 w-20 rounded-full"
              />
              <div>
                <p className="text-sm">{userData?.bio || 'No bio available'}</p>
                <div className="mt-2 flex gap-4">
                  <div>
                    <p className="font-bold">{formatNumber(userData?.followers || 0)}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <p className="font-bold">{formatNumber(userData?.following || 0)}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </div>
                  <div>
                    <p className="font-bold">{formatNumber(userData?.likes || 0)}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div>
                    <p className="font-bold">{posts.length}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement stats */}
            <div>
              <h3 className="text-sm font-medium mb-3">Average Engagement per Post</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-2xl font-bold">{formatNumber(avgViews)}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-2xl font-bold">{formatNumber(avgLikes)}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-2xl font-bold">{formatNumber(avgComments)}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-2xl font-bold">{formatNumber(avgShares)}</p>
                  <p className="text-xs text-muted-foreground">Shares</p>
                </div>
              </div>
            </div>

            {/* Recent posts preview */}
            {posts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Posts ({posts.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {posts.slice(0, 6).map((post) => (
                    <div key={post.id} className="rounded-md overflow-hidden bg-muted aspect-[9/16] relative">
                      {post.video_cover_url ? (
                        <img
                          src={post.video_cover_url}
                          alt={post.description || 'TikTok post'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Preview
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                        <p className="line-clamp-1">{post.description || 'No description'}</p>
                        <div className="flex justify-between mt-1 text-[10px]">
                          <span>{formatNumber(post.plays || 0)} views</span>
                          <span>{formatNumber(post.likes || 0)} likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="outline" onClick={onClose}>Close</Button>
              </DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}