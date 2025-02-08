import { NextResponse } from "next/server"
import axios from "axios"
import * as cheerio from "cheerio"

export async function POST(req: Request) {
  const { url } = await req.json()
  const debugInfo: any = { url }

  try {
    // Step 1: Fetch the URL
    debugInfo.step1 = "Fetching URL"
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    debugInfo.step1Result = {
      status: response.status,
      headers: response.headers,
      dataLength: response.data.length,
    }

    // Step 2: Parse with Cheerio
    debugInfo.step2 = "Parsing with Cheerio"
    const $ = cheerio.load(response.data)
    debugInfo.step2Result = {
      title: $("title").text(),
      metaTags: $("meta").length,
    }

    // Step 3: Extract metrics
    debugInfo.step3 = "Extracting metrics"
    const likes = $('[data-e2e="like-count"]').text()
    const comments = $('[data-e2e="comment-count"]').text()
    const shares = $('[data-e2e="share-count"]').text()
    debugInfo.step3Result = { likes, comments, shares }

    return NextResponse.json(debugInfo)
  } catch (error) {
    debugInfo.error = error.message
    return NextResponse.json(debugInfo, { status: 500 })
  }
}

