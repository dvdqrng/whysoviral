import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const SCRAPTIK_API_URL = "https://scraptik.p.rapidapi.com/get-video"
const RAPID_API_KEY = process.env.RAPID_API_KEY

interface ScraptikResponse {
  code: number
  msg: string
  processed_time: string
  data: {
    aweme_id: string
    desc: string
    create_time: number
    author: {
      uid: string
      unique_id: string
      nickname: string
      avatar_larger: {
        url_list: string[]
      }
    }
    statistics: {
      digg_count: number
      share_count: number
      comment_count: number
      play_count: number
    }
    video: {
      duration: number
      ratio: string
      cover: {
        url_list: string[]
      }
      play_addr: {
        url_list: string[]
      }
      download_addr: {
        url_list: string[]
      }
    }
    music: {
      id: string
      title: string
      author: string
      is_original: boolean
      play_url: {
        url_list: string[]
      }
      cover_large: {
        url_list: string[]
      }
    }
  }
}

export async function POST(req: Request) {
  console.log("Starting /api/analyze route")

  try {
    const { url } = await req.json()
    console.log("Received URL:", url)

    if (!url) {
      console.error("Error: URL is required")
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!RAPID_API_KEY) {
      console.error("Error: RAPID_API_KEY is not configured")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    console.log("Fetching TikTok data from Scraptik API")
    const response = await fetch(`${SCRAPTIK_API_URL}?url=${encodeURIComponent(url)}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "scraptik.p.rapidapi.com",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Scraptik API Error:", errorText)
      return NextResponse.json(
        {
          error: "Failed to fetch video data",
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    console.log("Parsing API response")
    const scraptikData: ScraptikResponse = await response.json()

    if (scraptikData.code !== 0) {
      console.error("Scraptik API returned an error:", scraptikData.msg)
      return NextResponse.json(
        {
          error: "API returned an error",
          details: scraptikData.msg,
        },
        { status: 400 },
      )
    }

    console.log("Processing and formatting data")
    const processedData = {
      id: scraptikData.data.aweme_id,
      description: scraptikData.data.desc,
      createdAt: new Date(scraptikData.data.create_time * 1000).toISOString(),
      author: {
        id: scraptikData.data.author.uid,
        username: scraptikData.data.author.unique_id,
        nickname: scraptikData.data.author.nickname,
        avatarUrl: scraptikData.data.author.avatar_larger.url_list[0],
      },
      stats: {
        likes: scraptikData.data.statistics.digg_count,
        shares: scraptikData.data.statistics.share_count,
        comments: scraptikData.data.statistics.comment_count,
        views: scraptikData.data.statistics.play_count,
      },
      video: {
        duration: scraptikData.data.video.duration,
        ratio: scraptikData.data.video.ratio,
        coverUrl: scraptikData.data.video.cover.url_list[0],
        playUrl: scraptikData.data.video.play_addr.url_list[0],
        downloadUrl: scraptikData.data.video.download_addr.url_list[0],
      },
      music: {
        id: scraptikData.data.music.id,
        title: scraptikData.data.music.title,
        author: scraptikData.data.music.author,
        isOriginal: scraptikData.data.music.is_original,
        playUrl: scraptikData.data.music.play_url.url_list[0],
        coverUrl: scraptikData.data.music.cover_large.url_list[0],
      },
    }

    console.log("Sending successful response")
    return NextResponse.json({
      success: true,
      data: processedData,
      timestamp: scraptikData.processed_time,
    })
  } catch (error) {
    console.error("Unexpected error in analyze route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

