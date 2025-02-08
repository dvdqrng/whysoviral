import { NextResponse } from "next/server"
import axios from "axios"

interface TikTokResponse {
  code: number
  msg: string
  data: {
    video: {
      id: string
      title: string
      url: string
      cover: string
      origin_cover: string
      duration: number
      play: string
    }
    music: {
      id: string
      title: string
      play: string
      author: string
      original: boolean
    }
    author: {
      id: string
      unique_id: string
      nickname: string
      avatar: string
    }
    statistics: {
      playCount: number
      downloadCount: number
      shareCount: number
      commentCount: number
      likeCount: number
      favoriteCount: number
    }
  }
}

// Add route segment config to ensure the route is registered
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  // Log that the route was hit
  console.log("[Debug] API Route: /api/analyze-video hit at", new Date().toISOString())

  console.log("API Route: Starting video analysis")

  try {
    const { url } = await req.json()
    console.log("[Debug] Received URL:", url)
    console.log("API Route: Analyzing URL:", url)

    const rapidApiKey = process.env.RAPID_API_KEY
    if (!rapidApiKey) {
      throw new Error("RAPID_API_KEY is not configured")
    }

    const response = await axios({
      method: "GET",
      url: "https://tiktok-video-downloader-api.p.rapidapi.com/media/video",
      params: { url },
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "tiktok-video-downloader-api.p.rapidapi.com",
      },
    })

    console.log("API Route: Received response from Rapid API")
    const tiktokData: TikTokResponse = response.data

    // Format the response
    const analysis = {
      video: {
        title: tiktokData.data.video.title,
        duration: tiktokData.data.video.duration,
        coverImage: tiktokData.data.video.cover,
      },
      author: {
        name: tiktokData.data.author.nickname,
        id: tiktokData.data.author.unique_id,
        avatar: tiktokData.data.author.avatar,
      },
      statistics: {
        plays: tiktokData.data.statistics.playCount,
        downloads: tiktokData.data.statistics.downloadCount,
        shares: tiktokData.data.statistics.shareCount,
        comments: tiktokData.data.statistics.commentCount,
        likes: tiktokData.data.statistics.likeCount,
        favorites: tiktokData.data.statistics.favoriteCount,
      },
      music: {
        title: tiktokData.data.music.title,
        author: tiktokData.data.music.author,
        isOriginal: tiktokData.data.music.original,
      },
      status: {
        code: tiktokData.code,
        message: tiktokData.msg,
      },
    }

    console.log("API Route: Analysis complete")
    return NextResponse.json(analysis)
  } catch (error) {
    console.error("API Route Error:", error)
    console.error("[Debug] Error in route:", error)

    if (axios.isAxiosError(error)) {
      console.error("Axios Error Details:", {
        response: error.response?.data,
        status: error.response?.status,
      })

      return NextResponse.json(
        {
          error: "Failed to fetch TikTok data",
          details: error.response?.data || error.message,
          status: error.response?.status,
        },
        {
          status: error.response?.status || 500,
        },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    )
  }
}

