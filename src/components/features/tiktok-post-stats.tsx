"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  Play,
  ThumbsUp,
  Share2,
  MessageCircle,
  Bookmark,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import type { TikTokPostStats, TikTokVideoDownload } from "@/lib/tiktok-post-service"
import { apiService } from "@/lib/api-service"

interface TikTokPostData {
  stats: TikTokPostStats
  download: TikTokVideoDownload
}

type DownloadStatus = "idle" | "initializing" | "downloading" | "complete" | "error"

export function TikTokPostStats() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [postData, setPostData] = useState<TikTokPostData | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle")
  const [downloadProgress, setDownloadProgress] = useState(0)

  const initiateDownload = async (downloadUrl: string) => {
    try {
      setDownloadStatus("initializing")
      setDownloadProgress(0)

      // Create a temporary anchor element
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", `tiktok-video-${Date.now()}.mp4`)
      link.setAttribute("target", "_blank")

      // Start download
      setDownloadStatus("downloading")

      // Simulate progress (since we can't track actual download progress for direct downloads)
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 10
        if (progress <= 90) {
          setDownloadProgress(progress)
        }
      }, 500)

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Complete the progress bar
      setTimeout(() => {
        clearInterval(progressInterval)
        setDownloadProgress(100)
        setDownloadStatus("complete")
      }, 6000) // Adjust timing based on average download time
    } catch (err) {
      setDownloadStatus("error")
      setError(err instanceof Error ? err.message : "Failed to download video")
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    setDownloadStatus("idle")
    setDownloadProgress(0)

    try {
      const data = await apiService.getTikTokPostStats(url)
      setPostData(data)

      // Automatically start download if URL is available
      if (data.download.url) {
        initiateDownload(data.download.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>TikTok Video Analysis</CardTitle>
        <CardDescription>Enter a TikTok video URL to analyze its stats and download the video</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="https://www.tiktok.com/@username/video/1234567890"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <Button onClick={fetchStats} disabled={loading || !url}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze
            </Button>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {postData && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={postData.stats.author.avatarUrl || "/placeholder.svg"}
                  alt={postData.stats.author.nickname}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-xl font-bold">{postData.stats.author.nickname}</h3>
                  <p className="text-sm text-muted-foreground">@{postData.stats.author.username}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Video Description</h4>
                <p className="text-sm">{postData.stats.description || "No description"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Posted on {new Date(postData.stats.createTime).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Play className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-xl font-bold">{postData.stats.stats.plays.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Plays</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <ThumbsUp className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-xl font-bold">{postData.stats.stats.likes.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Likes</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Share2 className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-xl font-bold">{postData.stats.stats.shares.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Shares</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <MessageCircle className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-xl font-bold">{postData.stats.stats.comments.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Comments</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Bookmark className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-xl font-bold">{postData.stats.stats.bookmarks.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Bookmarks</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Video Details</h4>
                  <div className="space-y-1 text-sm">
                    <p>Duration: {postData.stats.video.duration}s</p>
                    <p>Ratio: {postData.stats.video.ratio}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Music</h4>
                  <div className="space-y-1 text-sm">
                    <p>{postData.stats.music.title}</p>
                    <p className="text-muted-foreground">by {postData.stats.music.author}</p>
                    {postData.stats.music.isOriginal && <Badge variant="secondary">Original Sound</Badge>}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Download Video</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {downloadStatus === "idle" && <Download className="h-4 w-4" />}
                    {downloadStatus === "initializing" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {downloadStatus === "downloading" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {downloadStatus === "complete" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {downloadStatus === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm">
                      {downloadStatus === "idle" && "Ready to download"}
                      {downloadStatus === "initializing" && "Preparing download..."}
                      {downloadStatus === "downloading" && "Downloading video..."}
                      {downloadStatus === "complete" && "Download complete!"}
                      {downloadStatus === "error" && "Download failed"}
                    </span>
                  </div>

                  {(downloadStatus === "downloading" || downloadStatus === "complete") && (
                    <Progress value={downloadProgress} className="w-full" />
                  )}

                  {downloadStatus === "error" && (
                    <Button
                      onClick={() => postData.download.url && initiateDownload(postData.download.url)}
                      variant="outline"
                      size="sm"
                    >
                      Retry Download
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

