import axios from "axios"

export interface TikTokPostStats {
  id: string
  description: string
  createTime: string
  author: {
    id: string
    username: string
    nickname: string
    avatarUrl: string | null
  }
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
    downloadUrl: string | null
    noWatermarkUrl: string | null
  }
  music: {
    id: string
    title: string
    author: string
    isOriginal: boolean
    playUrl: string | null
    coverUrl: string | null
  }
}

export interface TikTokVideoDownload {
  url: string
  format: string
  size: number
}

function isValidTikTokUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    // Check if it's a TikTok domain
    if (!urlObj.hostname.includes("tiktok.com")) {
      return false
    }
    // Check if it has a video ID
    const hasVideoId = url.includes("/video/") && /\/video\/\d{19}/.test(url)
    return hasVideoId
  } catch {
    return false
  }
}

function extractVideoId(url: string): string | null {
  try {
    const match = url.match(/\/video\/(\d{19})/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function getFirstUrlFromList(urlList: any): string | null {
  if (Array.isArray(urlList) && urlList.length > 0) {
    return urlList[0]
  }
  return null
}

async function getVideoWithoutWatermark(url: string): Promise<string | null> {
  try {
    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error("Invalid TikTok video URL")
    }

    const options = {
      method: "GET",
      url: "https://scraptik.p.rapidapi.com/video-without-watermark",
      params: { aweme_id: videoId },
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
      throw new Error(response.data.status_msg || "Failed to fetch video without watermark")
    }

    return response.data.no_watermark_link || null
  } catch (error) {
    console.error("Error fetching video without watermark:", error)
    return null
  }
}

export async function getTikTokPostData(
  url: string,
): Promise<{ stats: TikTokPostStats; download: TikTokVideoDownload }> {
  try {
    if (!isValidTikTokUrl(url)) {
      throw new Error("Invalid TikTok URL format. Please provide a valid TikTok video URL.")
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error("Could not extract video ID from URL")
    }

    // First, get the video details
    const videoDetailsOptions = {
      method: "GET",
      url: "https://scraptik.p.rapidapi.com/get-post",
      params: { aweme_id: videoId },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-rapidapi-ua": "RapidAPI-Playground",
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "scraptik.p.rapidapi.com",
      },
    }

    const videoDetailsResponse = await axios.request(videoDetailsOptions)

    if (videoDetailsResponse.data.status_code !== 0) {
      throw new Error(videoDetailsResponse.data.status_msg || "Failed to fetch video details")
    }

    if (!videoDetailsResponse.data.aweme_detail) {
      throw new Error("Invalid response structure from TikTok API")
    }

    const post = videoDetailsResponse.data.aweme_detail

    // Get no watermark URL in parallel
    const noWatermarkUrl = await getVideoWithoutWatermark(url)

    // Safely access nested properties
    const author = post.author || {}
    const stats = post.statistics || {}
    const video = post.video || {}
    const music = post.music || {}

    const postStats: TikTokPostStats = {
      id: post.aweme_id || videoId,
      description: post.desc || "",
      createTime: new Date((post.create_time || 0) * 1000).toISOString(),
      author: {
        id: author.uid || "",
        username: author.unique_id || "",
        nickname: author.nickname || "",
        avatarUrl: getFirstUrlFromList(author.avatar_larger?.url_list),
      },
      stats: {
        plays: Number(stats.play_count || 0),
        likes: Number(stats.digg_count || 0),
        shares: Number(stats.share_count || 0),
        comments: Number(stats.comment_count || 0),
        bookmarks: Number(stats.collect_count || 0),
      },
      video: {
        duration: Number(video.duration || 0),
        ratio: video.ratio || "0:0",
        coverUrl: getFirstUrlFromList(video.cover?.url_list),
        playUrl: getFirstUrlFromList(video.play_addr?.url_list),
        downloadUrl: getFirstUrlFromList(video.download_addr?.url_list),
        noWatermarkUrl: noWatermarkUrl,
      },
      music: {
        id: music.id || "",
        title: music.title || "",
        author: music.author || "",
        isOriginal: Boolean(music.is_original),
        playUrl: getFirstUrlFromList(music.play_url?.url_list),
        coverUrl: getFirstUrlFromList(music.cover_large?.url_list),
      },
    }

    const videoDownload: TikTokVideoDownload = {
      url: noWatermarkUrl || postStats.video.downloadUrl || "",
      format: "mp4",
      size: video.download_addr?.data_size || 0,
    }

    return { stats: postStats, download: videoDownload }
  } catch (error) {
    console.error("Error fetching TikTok post:", error)
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(
        `TikTok API Error: ${error.response.data.status_msg || error.response.data.message || "Unknown error"}`,
      )
    }
    throw error
  }
}

