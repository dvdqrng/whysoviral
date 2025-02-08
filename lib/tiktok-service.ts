import axios from "axios"
import { getTikTokUserFromDB, getTikTokPostsFromDB, upsertTikTokUser, upsertTikTokPosts, shouldRefreshData } from "./db/supabase"

export interface TikTokUserStats {
  username: string
  nickname: string
  followers: string
  following: string
  likes: string
  videos: string
  verified: boolean
  bio: string
  category: string
  avatar: string
}

export interface TikTokUserPost {
  id: string
  desc: string
  createTime: string
  stats: {
    plays: number
    likes: number
    shares: number
    comments: number
    bookmarks: number
  }
  video: {
    duration: number
    ratio: string
    coverUrl: string | null
    playUrl: string | null
  }
  music: {
    title: string
    author: string
    isOriginal: boolean
  }
}

export async function getTikTokUserStats(username: string): Promise<TikTokUserStats> {
  try {
    // Check if we have recent data in the database
    const shouldRefresh = await shouldRefreshData(username)
    if (!shouldRefresh) {
      const cachedUser = await getTikTokUserFromDB(username)
      if (cachedUser) {
        return {
          username: cachedUser.username,
          nickname: cachedUser.nickname,
          followers: cachedUser.followers.toLocaleString(),
          following: cachedUser.following.toLocaleString(),
          likes: cachedUser.likes.toLocaleString(),
          videos: cachedUser.videos.toLocaleString(),
          verified: cachedUser.verified,
          bio: cachedUser.bio,
          category: cachedUser.category,
          avatar: cachedUser.avatar,
        }
      }
    }

    // If no cached data or data is old, fetch from API
    const options = {
      method: "GET",
      url: "https://scraptik.p.rapidapi.com/get-user",
      params: { username },
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "scraptik.p.rapidapi.com",
      },
    }

    const response = await axios.request(options)
    console.log("User API Response:", JSON.stringify(response.data, null, 2))

    if (!response.data || !response.data.user) {
      throw new Error("Failed to fetch user stats: " + (response.data?.status_msg || "Unknown error"))
    }

    const user = response.data.user
    const userData = {
      username: user.sec_uid || user.unique_id,
      nickname: user.nickname,
      followers: Number(user.follower_count).toLocaleString(),
      following: Number(user.following_count).toLocaleString(),
      likes: Number(user.total_favorited).toLocaleString(),
      videos: Number(user.aweme_count).toLocaleString(),
      verified: Boolean(user.enterprise_verify_reason),
      bio: user.signature,
      category: user.category || "Not specified",
      avatar: user.avatar_larger?.url_list?.[0] || null,
    }

    // Store in database
    await upsertTikTokUser(userData)

    return userData
  } catch (error) {
    console.error("Error fetching user stats:", error)

    // If API fails, try to return cached data even if it's old
    const cachedUser = await getTikTokUserFromDB(username)
    if (cachedUser) {
      return {
        username: cachedUser.username,
        nickname: cachedUser.nickname,
        followers: cachedUser.followers.toLocaleString(),
        following: cachedUser.following.toLocaleString(),
        likes: cachedUser.likes.toLocaleString(),
        videos: cachedUser.videos.toLocaleString(),
        verified: cachedUser.verified,
        bio: cachedUser.bio,
        category: cachedUser.category,
        avatar: cachedUser.avatar,
      }
    }

    throw error
  }
}

export async function getTikTokUserPosts(username: string, cursor: string = "0"): Promise<{ posts: TikTokUserPost[], hasMore: boolean, nextCursor: string }> {
  try {
    // Check if we have recent data in the database
    const shouldRefresh = await shouldRefreshData(username)
    if (!shouldRefresh && cursor === "0") { // Only use cache for initial load
      const cachedPosts = await getTikTokPostsFromDB(username)
      if (cachedPosts && cachedPosts.length > 0) {
        return {
          posts: cachedPosts.map(post => ({
            id: post.id,
            desc: post.description,
            createTime: post.created_at,
            stats: {
              plays: post.plays,
              likes: post.likes,
              shares: post.shares,
              comments: post.comments,
              bookmarks: post.bookmarks,
            },
            video: {
              duration: post.video_duration,
              ratio: post.video_ratio,
              coverUrl: post.video_cover_url,
              playUrl: post.video_play_url,
            },
            music: {
              title: post.music_title,
              author: post.music_author,
              isOriginal: post.music_is_original,
            },
          })),
          hasMore: false, // Since we're returning all cached posts
          nextCursor: "0"
        }
      }
    }

    // If no cached data or data is old, fetch from API
    const userResponse = await getTikTokUserStats(username)

    const options = {
      method: "GET",
      url: "https://scraptik.p.rapidapi.com/user-posts",
      params: {
        user_id: userResponse.username,
        count: "10",
        max_cursor: cursor
      },
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "scraptik.p.rapidapi.com",
      },
    }

    console.log("Making request with options:", JSON.stringify(options, null, 2))

    const response = await axios.request(options)
    console.log("API Response:", JSON.stringify(response.data, null, 2))

    if (!response.data || !response.data.aweme_list) {
      throw new Error("Failed to fetch user posts: " + (response.data?.status_msg || "Unknown error"))
    }

    const posts = response.data.aweme_list.map((post: any) => ({
      id: post.aweme_id,
      desc: post.desc || "",
      createTime: new Date((post.create_time || 0) * 1000).toISOString(),
      stats: {
        plays: Number(post.statistics?.play_count || 0),
        likes: Number(post.statistics?.digg_count || 0),
        shares: Number(post.statistics?.share_count || 0),
        comments: Number(post.statistics?.comment_count || 0),
        bookmarks: Number(post.statistics?.collect_count || 0),
      },
      video: {
        duration: Number(post.video?.duration || 0),
        ratio: post.video?.ratio || "0:0",
        coverUrl: post.video?.cover?.url_list?.[0] || null,
        playUrl: post.video?.play_addr?.url_list?.[0] || null,
      },
      music: {
        title: post.music?.title || "",
        author: post.music?.author || "",
        isOriginal: Boolean(post.music?.is_original),
      },
    }))

    // Store in database if this is the first page
    if (cursor === "0") {
      await upsertTikTokPosts(posts, username)
    }

    return {
      posts,
      hasMore: response.data.has_more,
      nextCursor: response.data.cursor || "0"
    }
  } catch (error) {
    console.error("Error fetching user posts:", error)

    // If API fails, try to return cached data
    if (cursor === "0") { // Only use cache for initial load
      const cachedPosts = await getTikTokPostsFromDB(username)
      if (cachedPosts && cachedPosts.length > 0) {
        return {
          posts: cachedPosts.map(post => ({
            id: post.id,
            desc: post.description,
            createTime: post.created_at,
            stats: {
              plays: post.plays,
              likes: post.likes,
              shares: post.shares,
              comments: post.comments,
              bookmarks: post.bookmarks,
            },
            video: {
              duration: post.video_duration,
              ratio: post.video_ratio,
              coverUrl: post.video_cover_url,
              playUrl: post.video_play_url,
            },
            music: {
              title: post.music_title,
              author: post.music_author,
              isOriginal: post.music_is_original,
            },
          })),
          hasMore: false,
          nextCursor: "0"
        }
      }
    }

    throw error
  }
}

