import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Video, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <div className="w-full max-w-5xl space-y-6">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-medium tracking-tight">Why So Viral</h1>
          <p className="text-xl text-muted-foreground">
            AI-powered insights to make your TikTok content go viral
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                <CardTitle>Single Video Analysis</CardTitle>
              </div>
              <CardDescription>
                Deep dive into individual TikTok video performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Analyze any TikTok video
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Get metrics (views, likes, shares)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Scene-by-scene breakdown
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  AI-generated tags for each scene
                </li>
              </ul>
              <Link href="/tier1" className="block">
                <Button className="w-full">Try Single Post Analysis</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <CardTitle>Account Analysis</CardTitle>
              </div>
              <CardDescription>
                Comprehensive analysis of your TikTok account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Connect your TikTok account
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Analyze all your videos
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Identify successful content patterns
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Improve your content strategy
                </li>
              </ul>
              <Link href="/tier2" className="block">
                <Button className="w-full">Try Account Analysis</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

