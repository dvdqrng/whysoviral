import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { MessageSquare, Heart, Repeat2, Bookmark } from "lucide-react";
import { ReactNode } from "react";

interface EngagementMetricsProps {
  data?: {
    comments: number;
    likes: number;
    shares: number;
    saves: number;
  };
  isDataLoading?: boolean;
  formatNumber: (num: number) => string;
}

interface MetricItemProps {
  icon: ReactNode;
  name: string;
  value: string;
  change: number;
  loading?: boolean;
}

function MetricItem({ icon, name, value, change, loading = false }: MetricItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
          {icon}
        </div>
        <span className="text-xs font-medium">{name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-xs font-medium">
          {loading ? <div className="w-10 h-3 bg-gray-200 dark:bg-gray-800 animate-pulse rounded"></div> : value}
        </div>
        <div className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      </div>
    </div>
  );
}

export function EngagementMetrics({
  data,
  isDataLoading = false,
  formatNumber
}: EngagementMetricsProps) {
  return (
    <Card className="w-full rounded-xl">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm">Engagement Metrics</CardTitle>
        <CardDescription className="text-xs">Average interactions per post</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          <MetricItem
            icon={<MessageSquare className="h-4 w-4" />}
            name="Comments"
            value={formatNumber(data?.comments || 1042)}
            change={4.5}
            loading={isDataLoading}
          />
          <MetricItem
            icon={<Heart className="h-4 w-4" />}
            name="Likes"
            value={formatNumber(data?.likes || 11200)}
            change={7.2}
            loading={isDataLoading}
          />
          <MetricItem
            icon={<Repeat2 className="h-4 w-4" />}
            name="Shares"
            value={formatNumber(data?.shares || 3100)}
            change={-2.1}
            loading={isDataLoading}
          />
          <MetricItem
            icon={<Bookmark className="h-4 w-4" />}
            name="Saves"
            value={formatNumber(data?.saves || 982)}
            change={12.3}
            loading={isDataLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
} 