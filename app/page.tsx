"use client"

import { useState } from 'react'
import Image from "next/image"
import { Container } from "./components/container"
import Link from "next/link"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { ArrowRight, Video, Users, Clock, TrendingUp, CheckCircle } from "lucide-react"
import { ColumnLayout, Column } from './components/column-layout'
import { useAuth } from "./lib/auth-context"

export default function Home() {
  const { user, loading } = useAuth()
  const [recentActivity, setRecentActivity] = useState<{ date: string, text: string }[]>([
    { date: "Today", text: "Updated account information" },
    { date: "Yesterday", text: "Analyzed 3 new videos" },
    { date: "2 days ago", text: "Added TikTok account @example" }
  ])

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-medium tracking-tight">Why So Viral</h1>
        <p className="text-xl text-muted-foreground">
          AI-powered insights to make your TikTok content go viral
        </p>
      </div>

      {user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Welcome Back, {user.email?.split('@')[0]}
            </CardTitle>
            <CardDescription>
              Your TikTok analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Activity
                </h3>
                <ul className="space-y-2">
                  {recentActivity.map((activity, i) => (
                    <li key={i} className="text-sm flex">
                      <span className="text-muted-foreground w-24 flex-shrink-0">{activity.date}</span>
                      <span>{activity.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold">2</div>
                    <div className="text-xs text-muted-foreground">Connected Accounts</div>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold">15</div>
                    <div className="text-xs text-muted-foreground">Analyzed Videos</div>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold">4</div>
                    <div className="text-xs text-muted-foreground">Reports Generated</div>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold">+22%</div>
                    <div className="text-xs text-muted-foreground">Engagement Increase</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ColumnLayout className="md:grid-cols-2 lg:grid-cols-2">
        <Column>
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              <CardTitle>Single Video Analysis</CardTitle>
            </div>
            <CardDescription>
              Deep dive into individual TikTok video performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Analyze any TikTok video
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Get metrics (views, likes, shares)
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Scene-by-scene breakdown
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                AI-generated tags for each scene
              </li>
            </ul>
            <Link href="/tier1" className="block">
              <Button className="w-full">Try Single Post Analysis</Button>
            </Link>
          </CardContent>
        </Column>

        <Column>
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <CardTitle>Account Analysis</CardTitle>
            </div>
            <CardDescription>
              Comprehensive analysis of your TikTok account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Connect your TikTok account
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Analyze all your videos
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Identify successful content patterns
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Improve your content strategy
              </li>
            </ul>
            <Link href="/tier2" className="block">
              <Button className="w-full">Try Account Analysis</Button>
            </Link>
          </CardContent>
        </Column>
      </ColumnLayout>
    </div>
  )
}

