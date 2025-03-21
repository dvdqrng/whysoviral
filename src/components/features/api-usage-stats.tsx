"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart } from "@tremor/react"
import { apiService } from "@/lib/api-service"
import { ApiUsageStats } from "@/lib/api-config"
import { formatDistanceToNow } from "date-fns"

export function ApiUsageStats() {
  const [stats, setStats] = useState<ApiUsageStats | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<number>(30) // seconds
  const [activeTab, setActiveTab] = useState<string>("overview")

  useEffect(() => {
    // Initial fetch
    fetchStats()

    // Set up interval for refreshing stats
    const intervalId = setInterval(fetchStats, refreshInterval * 1000)

    // Clean up on unmount
    return () => clearInterval(intervalId)
  }, [refreshInterval])

  const fetchStats = () => {
    const currentStats = apiService.getUsageStats()
    setStats(currentStats)
  }

  const handleReset = () => {
    apiService.resetUsageStats()
    fetchStats()
  }

  if (!stats) {
    return <div>Loading API usage statistics...</div>
  }

  // Format data for charts
  const endpointData = Object.entries(stats.callsByEndpoint).map(([name, count]) => ({
    name,
    calls: count,
    cost: stats.costByEndpoint[name] || 0
  }))

  // Improve the display names for endpoints in the charts
  const chartData = endpointData.map(item => ({
    name: item.name.replace('tiktok-', '')
      .replace('video-analysis', 'Video Analysis')
      .replace('post-stats', 'Post Stats')
      .replace('profiles', 'Profiles')
      .replace('refresh', 'Refresh')
      .replace('user-info', 'User Info')
      .replace('user-add', 'Add Account'),
    "API Calls": item.calls,
    "Cost": parseFloat((item.cost).toFixed(2))
  }))

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>API Usage Dashboard</CardTitle>
            <CardDescription>
              Monitor your API usage and costs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Last reset: {formatDistanceToNow(new Date(stats.lastReset), { addSuffix: true })}
            </span>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset Stats
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCalls}</div>
                  <Progress
                    value={Math.min(100, (stats.totalCalls / 1000) * 100)}
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
                  <Progress
                    value={Math.min(100, (stats.totalCost / 10) * 100)}
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Refresh Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                    </select>
                    <Button size="sm" onClick={fetchStats}>
                      Refresh Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="py-2 px-4 text-left">Endpoint</th>
                    <th className="py-2 px-4 text-right">Calls</th>
                    <th className="py-2 px-4 text-right">Cost</th>
                    <th className="py-2 px-4 text-right">Avg. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.callsByEndpoint).map(([endpoint, calls]) => (
                    <tr key={endpoint} className="border-b">
                      <td className="py-2 px-4">{endpoint}</td>
                      <td className="py-2 px-4 text-right">{calls}</td>
                      <td className="py-2 px-4 text-right">${(stats.costByEndpoint[endpoint] || 0).toFixed(2)}</td>
                      <td className="py-2 px-4 text-right">
                        ${calls > 0 ? ((stats.costByEndpoint[endpoint] || 0) / calls).toFixed(4) : "0.0000"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-medium bg-muted">
                    <td className="py-2 px-4">Total</td>
                    <td className="py-2 px-4 text-right">{stats.totalCalls}</td>
                    <td className="py-2 px-4 text-right">${stats.totalCost.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">
                      ${stats.totalCalls > 0 ? (stats.totalCost / stats.totalCalls).toFixed(4) : "0.0000"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="charts">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium mb-3">API Calls by Endpoint</h3>
                <BarChart
                  className="h-72"
                  data={chartData}
                  index="name"
                  categories={["API Calls"]}
                  colors={["blue"]}
                  valueFormatter={(v) => `${v} calls`}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Cost by Endpoint</h3>
                <BarChart
                  className="h-72"
                  data={chartData}
                  index="name"
                  categories={["Cost"]}
                  colors={["green"]}
                  valueFormatter={(v) => `$${v.toFixed(2)}`}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 