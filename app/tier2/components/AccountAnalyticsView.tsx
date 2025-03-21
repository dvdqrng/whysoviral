"use client"

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, AreaChart, Area, Cell } from 'recharts'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { PostConsistencyCard } from "./PostConsistencyCard"
import { RecentPostsCard } from "./RecentPostsCard"
import { AccountProfileHeader } from "./AccountProfileHeader"
import { TopPerformingPostsCard } from "./TopPerformingPostsCard"
import { EngagementOverviewCard } from "./EngagementOverviewCard"
import { GrowthRateCard } from "./GrowthRateCard"

interface AccountAnalyticsViewProps {
  activeProfile: any
  setActiveTab: (tab: string) => void
  timeframe: 1 | 3 | 6 | 12
  setTimeframe: (timeframe: 1 | 3 | 6 | 12) => void
  formatNumber: (num: number) => string
  isRefreshing?: boolean
  getContributionData: (posts: any[]) => { dates: { date: string, count: number }[], maxCount: number }
  getContributionColor: (count: number, maxCount: number) => string
  getTimeframeMonthLabels: () => string[]
}

export function AccountAnalyticsView({
  activeProfile,
  setActiveTab,
  timeframe,
  setTimeframe,
  formatNumber,
  isRefreshing = false,
  getContributionData,
  getContributionColor,
  getTimeframeMonthLabels
}: AccountAnalyticsViewProps) {
  // Get data for the contribution graph
  const contributionData = getContributionData(activeProfile.posts);
  const months = getTimeframeMonthLabels();

  return (
    <div className="w-full">
      {/* Use the new AccountProfileHeader component */}
      <AccountProfileHeader
        profile={activeProfile}
        setActiveTab={setActiveTab}
        formatNumber={formatNumber}
      />

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* Top Performing Posts - Now using the dedicated component */}
        <div className="md:col-span-1 lg:col-span-1">
          <TopPerformingPostsCard
            posts={activeProfile.posts}
            timeframe={timeframe}
            formatNumber={formatNumber}
          />
        </div>

        {/* Engagement Overview */}
        <EngagementOverviewCard
          data={{
            likes: activeProfile.posts.length > 0
              ? Math.round(activeProfile.posts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0) / activeProfile.posts.length)
              : 11200,
            comments: activeProfile.posts.length > 0
              ? Math.round(activeProfile.posts.reduce((sum: number, post: any) => sum + (post.comments || 0), 0) / activeProfile.posts.length)
              : 1042,
            shares: activeProfile.posts.length > 0
              ? Math.round(activeProfile.posts.reduce((sum: number, post: any) => sum + (post.shares || 0), 0) / activeProfile.posts.length)
              : 3100,
            saves: activeProfile.posts.length > 0
              ? Math.round(activeProfile.posts.reduce((sum: number, post: any) => sum + (post.saves || 0), 0) / activeProfile.posts.length)
              : 982
          }}
          formatNumber={formatNumber}
        />

        {/* Post Consistency */}
        <PostConsistencyCard
          posts={activeProfile.posts}
          getContributionData={getContributionData}
          getContributionColor={getContributionColor}
          getTimeframeMonthLabels={getTimeframeMonthLabels}
        />

        {/* Growth Rate */}
        <GrowthRateCard
          data={{
            followers: {
              value: [
                activeProfile.analytics?.followerCounts?.[0] || 15000,
                activeProfile.analytics?.followerCounts?.[1] || 14000,
                activeProfile.analytics?.followerCounts?.[2] || 19000,
                activeProfile.analytics?.followerCounts?.[3] || 22000,
                activeProfile.analytics?.followerCounts?.[4] || 25000,
                activeProfile.analytics?.followerCounts?.[5] || 28000,
                activeProfile.analytics?.followerCounts?.[6] || 30000
              ],
              growth: activeProfile.analytics?.followerGrowthRate || "+12.5%"
            },
            views: {
              value: [
                activeProfile.analytics?.viewCounts?.[0] || 35000,
                activeProfile.analytics?.viewCounts?.[1] || 32000,
                activeProfile.analytics?.viewCounts?.[2] || 38000,
                activeProfile.analytics?.viewCounts?.[3] || 41000,
                activeProfile.analytics?.viewCounts?.[4] || 48000,
                activeProfile.analytics?.viewCounts?.[5] || 50000,
                activeProfile.analytics?.viewCounts?.[6] || 52000
              ],
              growth: activeProfile.analytics?.viewsTrend &&
                activeProfile.analytics.viewsTrend.length > 0 ?
                activeProfile.analytics.viewsTrend[activeProfile.analytics.viewsTrend.length - 1]?.trend || "+8.2%" :
                "+8.2%"
            }
          }}
          formatNumber={formatNumber}
        />
      </div>

      {/* Recent Posts */}
      <div className="mt-6">
        <RecentPostsCard
          posts={activeProfile.posts}
          timeframe={timeframe}
          formatNumber={formatNumber}
        />
      </div>
    </div>
  )
} 