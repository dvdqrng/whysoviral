"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, Users, Heart, Video } from "lucide-react"
import type { TikTokUserStats as TikTokUserStatsType } from "@/lib/tiktok-service"

export function TikTokUserStats() {
  const [profileUrl, setProfileUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TikTokUserStatsType | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>TikTok User Analysis</CardTitle>
        <CardDescription>Enter a TikTok profile URL to analyze their stats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
            <div className="space-y-6">
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

