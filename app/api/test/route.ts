import { NextResponse } from "next/server"
import axios from "axios"

// Support both GET and POST methods
export async function GET(req: Request) {
  return NextResponse.json({ ok: true, time: new Date().toISOString() })
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    console.log("Processing URL:", url)

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

    return NextResponse.json({
      ok: true,
      data: response.data,
      processed: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

