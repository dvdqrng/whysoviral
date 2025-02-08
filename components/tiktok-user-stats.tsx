"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, Users, Heart, Video, Play, Share2, MessageCircle, Bookmark } from "lucide-react"
import type { TikTokUserStats as TikTokUserStatsType, TikTokUserPost } from "@/lib/tiktok-service"

export function TikTokUserStats() {
  const [profileUrl, setProfileUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TikTokUserStatsType | null>(null)
  const [posts, setPosts] = useState<TikTokUserPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState("0")
  const [loadingPosts, setLoadingPosts] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    setPosts([])
    setHasMore(true)
    setNextCursor("0")

    try {
      const response = await fetch("/api/tiktok/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user stats")
      }

      setStats(data.data)
      // After getting user stats, fetch their posts
      fetchPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    if (loadingPosts || !hasMore) return

    setLoadingPosts(true)
    try {
      const response = await fetch("/api/tiktok/user/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileUrl, cursor: nextCursor }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user posts")
      }

      setPosts(prev => [...prev, ...data.data.posts])
      setHasMore(data.data.hasMore)
      setNextCursor(data.data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts")
    } finally {
      setLoadingPosts(false)
    }
  }

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        === document.documentElement.offsetHeight
      ) {
        fetchPosts()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [nextCursor, hasMore, loadingPosts])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>TikTok User Analysis</CardTitle>
        <CardDescription>Enter a TikTok profile URL to analyze their stats and posts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="flex gap-4">
            <Input
              placeholder="https://www.tiktok.com/@username"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              disabled={loading}
            />
            <Button onClick={fetchStats} disabled={loading || !profileUrl}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze
            </Button>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {stats && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                {stats.avatar && (
                  <img
                    src={stats.avatar || "/placeholder.svg"}
                    alt={stats.nickname}
                    className="w-20 h-20 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {stats.nickname}
                    {stats.verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{stats.username}</p>
                  {stats.category && <Badge variant="secondary">{stats.category}</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.followers}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Heart className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.likes}</div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Video className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.videos}</div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
              </div>

              {stats.bio && (
                <div>
                  <h4 className="font-semibold mb-2">Bio</h4>
                  <p className="text-sm">{stats.bio}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-4">Posts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      {post.video.coverUrl && (
                        <div className="relative aspect-video">
                          <img
                            src={post.video.coverUrl}
                            alt={post.desc}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <p className="text-sm mb-2 line-clamp-2">{post.desc || "No description"}</p>
                        <div className="text-xs text-muted-foreground mb-3">
                          Posted on {new Date(post.createTime).toLocaleDateString()}
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          <div>
                            <Play className="h-4 w-4 mx-auto mb-1" />
                            <div className="text-xs">{post.stats.plays.toLocaleString()}</div>
                          </div>
                          <div>
                            <Heart className="h-4 w-4 mx-auto mb-1" />
                            <div className="text-xs">{post.stats.likes.toLocaleString()}</div>
                          </div>
                          <div>
                            <Share2 className="h-4 w-4 mx-auto mb-1" />
                            <div className="text-xs">{post.stats.shares.toLocaleString()}</div>
                          </div>
                          <div>
                            <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                            <div className="text-xs">{post.stats.comments.toLocaleString()}</div>
                          </div>
                          <div>
                            <Bookmark className="h-4 w-4 mx-auto mb-1" />
                            <div className="text-xs">{post.stats.bookmarks.toLocaleString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {loadingPosts && (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No more posts to load
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

