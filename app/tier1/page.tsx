"use client"

import { TikTokPostStats } from "@/components/tiktok-post-stats"

export default function Tier1() {
  return (
    <div className="container max-w-5xl py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Single Post Analysis</h1>
          <p className="text-muted-foreground">
            Analyze any TikTok video to get detailed insights and metrics
          </p>
        </div>
        <TikTokPostStats />
      </div>
    </div>
  )
}

