import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface TikTokUserCardProps {
  user: any
  posts: any[]
  selected: boolean
  onSelect: (username: string) => void
}

export default function TikTokUserCard({ user, posts, selected, onSelect }: TikTokUserCardProps) {
  const profilePic = user.avatar || '/placeholder-avatar.jpg'
  const postsCount = posts.length
  const totalLikes = posts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0)
  const totalViews = posts.reduce((sum: number, post: any) => sum + (post.plays || 0), 0)

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <Card className={`overflow-hidden transition-colors ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-0">
        <div className="h-24 bg-gradient-to-r from-blue-400 to-purple-500"></div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex">
          <div className="mr-4 -mt-12">
            <img
              src={profilePic}
              alt={`${user.username} profile`}
              className="h-16 w-16 rounded-full border-4 border-white dark:border-gray-900 object-cover"
            />
          </div>
          <div className="flex-1 -mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{user.nickname || user.username}</h3>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <Button
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => onSelect(user.username)}
              >
                {selected ? 'Selected' : 'View Stats'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{user.bio || 'No bio available'}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted p-2">
            <p className="text-xs text-muted-foreground">Followers</p>
            <p className="font-medium">{formatNumber(user.followers || 0)}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <p className="text-xs text-muted-foreground">Posts</p>
            <p className="font-medium">{postsCount}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <p className="text-xs text-muted-foreground">Likes</p>
            <p className="font-medium">{formatNumber(totalLikes)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 