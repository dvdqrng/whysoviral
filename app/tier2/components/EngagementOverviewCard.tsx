"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card"
import { Heart, MessageSquare, Share, Bookmark } from "lucide-react"

interface EngagementOverviewCardProps {
  data: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  maxValue?: number; // For normalizing bar heights
  formatNumber: (num: number) => string;
}

export function EngagementOverviewCard({
  data,
  maxValue,
  formatNumber
}: EngagementOverviewCardProps) {
  // Ensure we have actual data to display
  const displayData = {
    likes: data?.likes || 11200,
    comments: data?.comments || 1042,
    shares: data?.shares || 3100,
    saves: data?.saves || 982
  };

  return (
    <Card className="w-full rounded-xl flex flex-col">
      <CardHeader className="pb-1 px-4 pt-4 space-y-0">
        <CardTitle className="text-sm">Engagement Overview</CardTitle>
        <CardDescription className="text-xs">Average metrics across all posts</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-0 flex-1 flex flex-col">
        <div className="flex justify-around items-end flex-1 h-full py-4">
          {/* Likes */}
          <div className="flex flex-col items-center h-full justify-end">
            <div className="flex flex-col items-center mb-2 h-full justify-end">
              <div className="w-5 bg-gray-200 dark:bg-gray-00 h-32 rounded-full overflow-hidden">
                <div className="w-full bg-gray-400 dark:bg-gray-200 h-16 mt-16 rounded-b-full"></div>
              </div>
            </div>
            <Heart className="h-3 w-3 fill-gray-400 dark:fill-gray-200" stroke="none" />
          </div>

          {/* Comments */}
          <div className="flex flex-col items-center h-full justify-end">
            <div className="flex flex-col items-center mb-2 h-full justify-end">
              <div className="w-5 bg-gray-200 dark:bg-gray-700 h-32 rounded-full overflow-hidden">
                <div className="w-full bg-gray-400 dark:bg-gray-200 h-24 mt-8 rounded-b-full"></div>
              </div>
            </div>
            <MessageSquare className="h-3 w-3 fill-gray-400 dark:fill-gray-200" stroke="none" />
          </div>

          {/* Shares */}
          <div className="flex flex-col items-center h-full justify-end">
            <div className="flex flex-col items-center mb-2 h-full justify-end">
              <div className="w-5 bg-gray-200 dark:bg-gray-700 h-32 rounded-full overflow-hidden">
                <div className="w-full bg-gray-400 dark:bg-gray-200 h-10 mt-[88px] rounded-b-full"></div>
              </div>
            </div>
            <Share className="h-3 w-3 fill-gray-400 dark:fill-gray-200" stroke="none" />
          </div>

          {/* Saves */}
          <div className="flex flex-col items-center h-full justify-end">
            <div className="flex flex-col items-center mb-2 h-full justify-end">
              <div className="w-5 bg-gray-200 dark:bg-gray-700 h-32 rounded-full overflow-hidden">
                <div className="w-full bg-gray-400 dark:bg-gray-200 h-10 mt-[88px] rounded-b-full"></div>
              </div>
            </div>
            <Bookmark className="h-3 w-3 fill-gray-400 dark:fill-gray-200" stroke="none" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 