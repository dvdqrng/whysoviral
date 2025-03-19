"use client"

import { TikTokPostStats } from "@/components/tiktok-post-stats"
// We don't need these anymore
// import { useEffect, useState } from 'react'
// import { checkAndRefreshDataIfNeeded } from '@/lib/refresh-helper'

export default function Tier1() {
  // Remove auto-refresh state and useEffect
  // const [isRefreshing, setIsRefreshing] = useState(false)

  // // Check if we need to refresh data when the page loads
  // useEffect(() => {
  //   const autoRefreshIfNeeded = async () => {
  //     try {
  //       // Skip if already refreshing
  //       if (isRefreshing) return

  //       setIsRefreshing(true)

  //       // Use the shared helper to check and refresh if needed
  //       await checkAndRefreshDataIfNeeded()
  //     } catch (error) {
  //       console.error('Error during auto-refresh check:', error)
  //     } finally {
  //       setIsRefreshing(false)
  //     }
  //   }

  //   autoRefreshIfNeeded()
  // }, [isRefreshing])

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

