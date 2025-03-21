import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tier 1 - Basic Analytics",
  description: "Basic TikTok analytics for individual posts"
}

// Create a placeholder component to replace the missing import
const TikTokPostStats = () => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 text-center">
      TikTok post statistics are currently unavailable
    </div>
  );
};

export default function Tier1() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">TikTok Post Analytics</h1>
      <TikTokPostStats />
    </div>
  )
}

