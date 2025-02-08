import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">TikTok AI Analysis</h1>
      <p className="text-xl text-center">Unlock the power of AI to analyze and improve your TikTok content</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="border p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Tier 1: Single Video Analysis</h2>
          <ul className="list-disc list-inside mb-4">
            <li>Analyze any TikTok video</li>
            <li>Get metrics (views, likes, shares)</li>
            <li>Scene-by-scene breakdown</li>
            <li>AI-generated tags for each scene</li>
          </ul>
          <Link href="/tier1">
            <Button>Try Single Video Analysis</Button>
          </Link>
        </div>

        <div className="border p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Tier 2: Account Analysis</h2>
          <ul className="list-disc list-inside mb-4">
            <li>Connect your TikTok account</li>
            <li>Analyze all your videos</li>
            <li>Identify successful content patterns</li>
            <li>Improve your content strategy</li>
          </ul>
          <Link href="/tier2">
            <Button>Try Account Analysis</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

