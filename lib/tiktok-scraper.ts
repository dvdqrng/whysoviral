import axios from "axios"

export interface TikTokMetrics {
  likes: number
  comments: number
  shares: number
}

export async function getTikTokMetrics(url: string): Promise<TikTokMetrics> {
  try {
    // First, get the video ID from the URL
    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error("Invalid TikTok URL")
    }

    // Use TikTok's oEmbed endpoint
    const oembedUrl = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/video/${videoId}`
    const response = await axios.get(oembedUrl)

    // Extract available information from the oEmbed response
    const { html, title, author_name } = response.data

    console.log("Embed data received:", {
      videoId,
      title,
      author: author_name,
      embedHtml: html,
    })

    // Return the data we can get from the oEmbed endpoint
    // Note: Like counts and other metrics are not available through oEmbed
    return {
      likes: -1, // Indicate that this data is not available
      comments: -1,
      shares: -1,
    }
  } catch (error) {
    console.error("Error fetching TikTok data:", error)
    throw new Error(`Failed to fetch TikTok data: ${error.message}`)
  }
}

function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // Handle different TikTok URL formats
    if (url.includes("/video/")) {
      const matches = url.match(/\/video\/(\d+)/)
      return matches ? matches[1] : null
    }

    // Handle shortened URLs
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    return pathParts[pathParts.length - 1]
  } catch {
    return null
  }
}

