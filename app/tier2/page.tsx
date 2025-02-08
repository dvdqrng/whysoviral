"use client"

import { TikTokUserStats } from "@/components/tiktok-user-stats"

export default function Tier2() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Account Analysis</h1>
      <TikTokUserStats />
    </div>
  )
}

