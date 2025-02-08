import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

function isValidTikTokUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname.includes("tiktok.com") &&
      (url.includes("/video/") || url.includes("/v/") || parsed.pathname.match(/[@/]/g)?.length >= 2)
    )
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 },
      )
    }

    if (!isValidTikTokUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid TikTok URL format. Please provide a valid TikTok video URL.",
        },
        { status: 400 },
      )
    }

    const rapidApiKey = process.env.RAPID_API_KEY
    if (!rapidApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API key not configured",
        },
        { status: 500 },
      )
    }

    // Test the API connection with a simple request
    const response = await fetch("https://tiktok-api23.p.rapidapi.com/v1/post/detail", {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "tiktok-api23.p.rapidapi.com",
      },
      params: { url },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "API request failed",
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "API connection successful",
      data: {
        apiStatus: "connected",
        urlValidation: "passed",
        responseStatus: response.status,
        videoData: data,
      },
    })
  } catch (error) {
    console.error("Error in test endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

