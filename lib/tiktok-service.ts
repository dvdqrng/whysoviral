import axios from "axios"

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
  const options = {
    method: "GET",
    url: "https://scraptik.p.rapidapi.com/get-user",
    params: { username },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-rapidapi-ua": "RapidAPI-Playground",
      "x-rapidapi-key": process.env.RAPID_API_KEY,
      "x-rapidapi-host": "scraptik.p.rapidapi.com",
    },
  }

  const response = await axios.request(options)
  const user = response.data.user

  return {
    username: user.unique_id,
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
}

export async function getTikTokUserPosts(username: string, cursor: string = "0"): Promise<{ posts: TikTokUserPost[], hasMore: boolean, nextCursor: string }> {
  const options = {
    method: "GET",
    url: "https://scraptik.p.rapidapi.com/user/posts",
    params: {
      username,
      cursor,
      count: "20" // Number of posts to fetch per request
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-rapidapi-ua": "RapidAPI-Playground",
      "x-rapidapi-key": process.env.RAPID_API_KEY,
      "x-rapidapi-host": "scraptik.p.rapidapi.com",
    },
  }

  const response = await axios.request(options)

  if (response.data.status_code !== 0) {
    throw new Error(response.data.status_msg || "Failed to fetch user posts")
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

  return {
    posts,
    hasMore: response.data.has_more,
    nextCursor: response.data.cursor || "0"
  }
}

