/**
 * Data formatting utilities for consistent formatting across the application
 */

import { TikTokAccount } from './db/models';

/**
 * Format TikTok user data from API response to database format
 * @param userData The TikTok API user data response
 * @param profileUrl The original profile URL or ID that was searched
 * @returns Formatted user data ready for database storage
 */
export function formatTikTokUserData(userData: any, profileUrl: string) {
  const user = userData?.data?.user
  const stats = userData?.data?.stats

  if (!user || !stats) {
    throw new Error('Invalid TikTok user data format')
  }

  console.log('Formatting TikTok user data with user ID:', user.id)

  return {
    // Use tiktok_uid as the primary key (matches actual DB structure)
    tiktok_uid: user.id,

    // Keep these for backward compatibility
    user_id: user.id,
    id: user.id,
    tiktok_id: user.id,

    // Core data fields
    username: user.uniqueId,
    nickname: user.nickname,
    followers: stats.followerCount || 0,
    following: stats.followingCount || 0,
    likes: stats.heart || stats.heartCount || 0,
    videos: stats.videoCount || 0,
    verified: !!user.verified,
    bio: user.signature || '',
    avatar: user.avatarLarger || user.avatarThumb,

    // Keep track of what profile URL was used to find this account
    profile_url: typeof profileUrl === 'string' && profileUrl.includes('tiktok.com')
      ? profileUrl
      : `https://www.tiktok.com/@${user.uniqueId}`,

    // Add timestamp
    last_updated: new Date().toISOString()
  }
} 