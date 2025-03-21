import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import axios from "axios"

interface VideoAnalysis {
  summary: string
  contentType: string
  engagement: {
    hook: string
    pacing: string
    retention: string
  }
  recommendations: string[]
}

export async function analyzeVideo(url: string): Promise<VideoAnalysis> {
  try {
    // First, get the video download URL using TikTok's API
    const rapidApiKey = process.env.RAPID_API_KEY
    if (!rapidApiKey) {
      throw new Error("RAPID_API_KEY is not configured")
    }

    const options = {
      method: "GET",
      url: "https://tiktok-download-video1.p.rapidapi.com/getVideo",
      params: { url },
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "tiktok-download-video1.p.rapidapi.com",
      },
    }

    console.log("Fetching video information...")
    const response = await axios.request(options)
    const videoData = response.data

    if (!videoData.video_url) {
      throw new Error("Failed to get video URL")
    }

    // Analyze the video content using AI
    console.log("Analyzing video content...")
    const prompt = `Analyze this TikTok video:
    Title: ${videoData.title}
    Description: ${videoData.description}
    Duration: ${videoData.duration} seconds
    
    Provide a detailed analysis including:
    1. Content summary
    2. Content type/category
    3. Engagement analysis (hook, pacing, potential retention)
    4. Specific recommendations for improvement
    
    Format the response as JSON with these keys: summary, contentType, engagement (with hook, pacing, retention), and recommendations (array)`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    // Parse the AI response
    const analysis: VideoAnalysis = JSON.parse(text)
    return analysis
  } catch (error) {
    console.error("Error in video analysis:", error)
    throw new Error(`Failed to analyze video: ${error.message}`)
  }
}

