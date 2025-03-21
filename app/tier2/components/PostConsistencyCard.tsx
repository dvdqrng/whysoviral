"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card"

interface PostConsistencyCardProps {
  posts: any[]
  getContributionData: (posts: any[]) => { dates: { date: string, count: number }[], maxCount: number }
  getContributionColor: (count: number, maxCount: number) => string
  getTimeframeMonthLabels: () => string[]
}

export function PostConsistencyCard({
  posts,
  getContributionData,
  getContributionColor,
  getTimeframeMonthLabels
}: PostConsistencyCardProps) {
  // Get labels for the visualization
  const months = getTimeframeMonthLabels();

  // Always show sample visualization for the prototype
  // In a real app, we'd use: const { dates, maxCount } = getContributionData(posts);

  return (
    <Card className="w-full rounded-xl flex flex-col">
      <CardHeader className="pb-2 px-4 pt-4 space-y-0.5">
        <CardTitle className="text-sm">Post Consistency</CardTitle>
        <CardDescription className="text-xs">Frequency of posts over time</CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-2 flex-1 flex flex-col justify-center">
        <div className="w-full">
          <div className="grid grid-cols-10 gap-1 w-full mt-4">
            {/* First row */}
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />

            {/* Second row */}
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />

            {/* Third row */}
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />

            {/* Fourth row */}
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />

            {/* Fifth row */}
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-3 pt-0 flex justify-center">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600" />
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </CardFooter>
    </Card>
  )
} 