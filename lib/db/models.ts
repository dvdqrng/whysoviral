/**
 * Type definitions for database tables in Supabase
 */

export interface TikTokAccount {
  user_id: string;
  username: string;
  nickname: string | null;
  followers: number;
  following: number;
  likes: number;
  videos: number;
  verified: boolean;
  bio: string | null;
  avatar: string | null;
  profile_url: string | null;
  last_updated: string;
}

export interface TikTokPost {
  id: string;
  username: string;
  description: string | null;
  created_at: string;
  plays: number;
  likes: number;
  shares: number;
  comments: number;
  bookmarks: number;
  video_duration: number;
  video_ratio: string | null;
  video_cover_url: string;
  video_play_url: string;
  music_title: string | null;
  music_author: string | null;
  music_is_original: boolean;
  music_duration: number | null;
  music_play_url: string | null;
  is_pinned: boolean;
  is_ad: boolean;
  region: string | null;
  hashtags: string[];
  mentions: string[];
  last_updated: string;
}

export interface User {
  id: string; // UUID
  username: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number | null;
  following_count: number | null;
  likes_count: number | null;
  video_count: number | null;
  created_at: string;
  updated_at: string;
  avg_views_per_post: number | null;
  avg_time_between_posts: number | null;
  weekly_post_frequency: Record<string, any> | null;
  views_trend: Record<string, any> | null;
  last_analytics_update: string | null;
}

export interface RefreshStatus {
  id: number; // Always 1 for the single app-wide refresh status record
  last_refresh_time: string; // ISO timestamp of the last refresh
  created_at?: string; // When the record was created
  updated_at?: string; // When the record was last updated
} 