import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    const rapidApiKey = process.env.RAPID_API_KEY
    if (!rapidApiKey) {
      return NextResponse.json(
        {
          error: "API key not configured",
        },
        { status: 500 },
      )
    }

    // Updated endpoint without v1 prefix
    const endpoint = "https://tiktok-api23.p.rapidapi.com/post/detail"
    const queryString = `?url=${encodeURIComponent(url)}`

    // Log full request details
    const debugInfo = {
      timestamp: new Date().toISOString(),
      inputUrl: url,
      apiKey: rapidApiKey ? "Present (first 6 chars): " + rapidApiKey.substring(0, 6) : "Missing",
      fullUrl: `${endpoint}${queryString}`,
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "tiktok-api23.p.rapidapi.com",
      },
    }

    console.log("Making request with:", {
      url: debugInfo.fullUrl,
      headers: debugInfo.headers,
    })

    // Make the actual API request
    const response = await fetch(debugInfo.fullUrl, {
      method: "GET",
      headers: debugInfo.headers,
    })

    const responseText = await response.text()
    console.log("Raw response:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = responseText
    }

    // Add warning if account is private
    const isPrivate = responseData?.error?.includes("private") || responseData?.message?.includes("private") || false

    return NextResponse.json({
      debug: {
        ...debugInfo,
        requestTimestamp: new Date().toISOString(),
        isPrivateAccount: isPrivate,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        rawResponse: responseText.substring(0, 1000), // First 1000 chars of raw response
      },
      warnings: isPrivate
        ? ["This appears to be a private account. The API may not be able to access its content."]
        : [],
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        errorObject: error,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

