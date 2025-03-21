"use client"

import { useState } from "react"
import { getSamplePosts } from "../../lib/analytics-service"

interface RecentPostsCardProps {
  posts: any[]
  timeframe: 1 | 3 | 6 | 12
  formatNumber: (num: number) => string
}

export function RecentPostsCard({
  posts,
  timeframe,
  formatNumber
}: RecentPostsCardProps) {
  // Get sample posts from analytics service instead of hardcoding here
  const samplePosts = getSamplePosts(undefined, timeframe);

  // Use real posts if available, otherwise use sample data
  const displayPosts = posts && posts.length > 0 ? posts : samplePosts;

  // Filter and sort posts
  const filteredPosts = displayPosts
    .slice()
    .filter((post: any) => {
      if (posts.length > 0) {
        // Only filter real posts by timeframe
        const postDate = new Date(post.created_at);
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - timeframe);
        return postDate >= cutoffDate;
      }
      return true; // Don't filter sample data
    })
    .sort((a: any, b: any) => {
      // Sort by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Recent Posts</h2>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Post</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3 text-right">Likes</th>
              <th className="px-4 py-3 text-right">Comments</th>
              <th className="px-4 py-3 text-right">Shares</th>
              <th className="px-4 py-3 text-right">Bookmarks</th>
              <th className="px-4 py-3 text-right">Engagement</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPosts.map((post: any) => {
              const engagementRate = post.plays > 0
                ? ((post.likes || 0) + (post.comments || 0) + (post.shares || 0)) / post.plays * 100
                : 0;

              const postDate = new Date(post.created_at);
              const formattedDate = `${postDate.getDate().toString().padStart(2, '0')}/${(postDate.getMonth() + 1).toString().padStart(2, '0')}/${postDate.getFullYear()}`;

              return (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm">{formattedDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-16 rounded-xl overflow-hidden relative flex-shrink-0">
                        {post.video_cover_url ? (
                          <img
                            src={post.video_cover_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center text-xs">No img</div>
                        )}
                      </div>
                      <p className="text-xs line-clamp-2 max-w-xs">{post.description || 'No description'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{formatNumber(post.plays || 0)}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatNumber(post.likes || 0)}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatNumber(post.comments || 0)}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatNumber(post.shares || 0)}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatNumber(post.bookmarks || 0)}</td>
                  <td className="px-4 py-3 text-right text-sm">{engagementRate.toFixed(1)}%</td>
                </tr>
              );
            })}
            {filteredPosts.length === 0 && posts.length > 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-sm text-gray-500">
                  No posts to display in the selected timeframe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 