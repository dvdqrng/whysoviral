"use client"

import TikTokUserStats from '@/components/tiktok-user-stats'

export default function Tier2Page() {
  return (
    <div>
      <div className="px-6 py-8">
        <h1 className="text-4xl font-medium tracking-tight">Account Analysis</h1>
      </div>
      <TikTokUserStats />
    </div>
  )
}

