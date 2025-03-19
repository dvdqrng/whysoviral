/**
 * Data formatting utilities for consistent formatting across the application
 */

import { TikTokAccount } from './db/models';

/**
 * Formats TikTok user data from API response to our database model
 */
export function formatTikTokUserData(userData: any, profileUrl?: string): Partial<TikTokAccount> {
  if (!userData?.data?.user) {
    throw new Error('Invalid user data structure');
  }

  const user = userData.data.user;
  const stats = userData.data.stats;

  return {
    user_id: user.id,
    username: user.uniqueId,
    nickname: user.nickname,
    bio: user.signature,
    avatar: user.avatarLarger || user.avatarThumb,
    verified: user.verified,
    followers: stats.followerCount,
    following: stats.followingCount,
    likes: stats.heart || stats.heartCount,
    videos: stats.videoCount,
    profile_url: profileUrl || `https://www.tiktok.com/@${user.uniqueId}`
  };
} 