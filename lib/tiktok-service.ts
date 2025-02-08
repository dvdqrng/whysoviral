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

