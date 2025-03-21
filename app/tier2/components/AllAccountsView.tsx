"use client"

import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "../../components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { LayoutGrid, List as ListIcon } from "lucide-react"

interface AllAccountsViewProps {
  profiles: any[]
  setActiveTab: (tab: string) => void
  formatNumber: (num: number) => string
  calculateEngagementRate: (profile: any) => string
  getPostFrequency: (profile: any) => string
  getAverageViews: (profile: any) => number
  handleAddAccount: () => void
}

export function AllAccountsView({
  profiles,
  setActiveTab,
  formatNumber,
  calculateEngagementRate,
  getPostFrequency,
  getAverageViews,
  handleAddAccount
}: AllAccountsViewProps) {
  return (
    <div className="w-full">
      {/* List/Table View */}
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead className="text-right">Avg. Views</TableHead>
              <TableHead className="text-right">Engagement</TableHead>
              <TableHead className="text-right">Post Frequency</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.user.username} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <TableCell className="font-medium" onClick={() => setActiveTab(profile.user.username)}>
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.user.avatar || '/placeholder-avatar.jpg'}
                      alt={profile.user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">{profile.user.nickname || profile.user.username}</div>
                      <div className="text-xs text-muted-foreground">@{profile.user.username}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right" onClick={() => setActiveTab(profile.user.username)}>
                  {formatNumber(profile.user.followers_count || 0)}
                </TableCell>
                <TableCell className="text-right" onClick={() => setActiveTab(profile.user.username)}>
                  {formatNumber(getAverageViews(profile))}
                </TableCell>
                <TableCell className="text-right" onClick={() => setActiveTab(profile.user.username)}>
                  {calculateEngagementRate(profile)}
                </TableCell>
                <TableCell className="text-right" onClick={() => setActiveTab(profile.user.username)}>
                  {getPostFrequency(profile)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(profile.user.username)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 