import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateInsights(analysisData: any) {
  const prompt = `
    Analyze the following TikTok video data and provide insights:
    
    Scenes: ${JSON.stringify(analysisData.scenes)}
    Image Analysis: ${JSON.stringify(analysisData.imageAnalysisResults)}
    Audio Transcription: ${analysisData.audioTranscription}
    Text Analysis: ${JSON.stringify(analysisData.textAnalysisResults)}
    Engagement Analysis: ${JSON.stringify(analysisData.engagementAnalysis)}
    
    Provide insights on:
    1. What elements of the video are most engaging?
    2. What topics or themes are present?
    3. How does this video compare to typical viral TikToks?
    4. What recommendations would you make to improve engagement?
  `

  const response = await openai.completions.create({
    model: "text-davinci-002",
    prompt: prompt,
    max_tokens: 500,
  })

  return response.data.choices[0].text
}

