"use client"

import { Button } from "../../components/ui/button"

interface AccountProfileHeaderProps {
  profile: any
  setActiveTab: (tab: string) => void
  formatNumber: (num: number) => string
}

export function AccountProfileHeader({
  profile,
  setActiveTab,
  formatNumber
}: AccountProfileHeaderProps) {
  // Extract bio from various possible locations in the profile data
  const bio = profile.user?.bio ||
    profile.user?.signature ||
    profile.raw_data?.signature ||
    profile.signature ||
    profile.bio ||
    profile.user_info?.signature ||
    profile.tiktok_info?.signature ||
    "";

  // Extract website/link from various possible locations
  const website = profile.user?.bioLink ||
    profile.user?.website ||
    profile.url ||
    profile.website ||
    profile.user_info?.bioLink ||
    profile.tiktok_info?.bioLink ||
    "";

  return (
    <div className="w-full mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
      <div className="p-6 text-black dark:text-white">
        {/* Profile Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <img
                src={profile.user.avatar || '/placeholder-avatar.jpg'}
                alt={profile.user.username}
                className="h-20 w-20 rounded-full border-2 border-gray-200 dark:border-white object-cover"
              />
              <div>
                <h2 className="text-xl font-bold">@{profile.user.username}</h2>
                <p className="text-sm text-black/80 dark:text-white/80">{profile.user.nickname || profile.user.username}</p>
                {bio && <p className="text-sm mt-2 text-black/90 dark:text-white/90 max-w-md">{bio}</p>}
                {website && (
                  <p className="text-sm mt-1 text-black/80 dark:text-white/80">
                    <span className="inline-flex items-center">🔗 {website}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-start space-x-10 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatNumber(profile.user.following || 0)}</p>
            <p className="text-xs text-black/80 dark:text-white/80">Following</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatNumber(profile.user.followers || 0)}</p>
            <p className="text-xs text-black/80 dark:text-white/80">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {formatNumber(profile.analytics?.totalLikes ||
                profile.posts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0))}
            </p>
            <p className="text-xs text-black/80 dark:text-white/80">Likes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatNumber(profile.posts?.length || 0)}</p>
            <p className="text-xs text-black/80 dark:text-white/80">Videos</p>
          </div>
        </div>
      </div>
    </div>
  )
}