"use client"

import TikTokUserStats from './tiktok-user-stats'

interface TikTokStatsWrapperProps {
  timeRange?: string;
}

export default function TikTokStatsWrapper({ timeRange = '1m' }: TikTokStatsWrapperProps) {
  return <TikTokUserStats initialTimeRange={timeRange} />
} 