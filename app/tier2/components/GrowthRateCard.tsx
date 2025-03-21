"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card"
import { useEffect } from "react"

// Add ApexCharts type declaration
declare global {
  interface Window {
    ApexCharts: any;
  }
}

interface GrowthRateCardProps {
  data?: {
    followers?: { value: number[], growth: string }
    views?: { value: number[], growth: string }
  }
  formatNumber: (num: number) => string
}

export function GrowthRateCard({
  data,
  formatNumber
}: GrowthRateCardProps) {
  // Use sample data if real data is not available
  const displayData = {
    followers: data?.followers || {
      value: [15000, 14000, 19000, 22000, 25000, 28000, 30000],
      growth: "+12.5%"
    },
    views: data?.views || {
      value: [35000, 32000, 38000, 41000, 48000, 50000, 52000],
      growth: "+8.2%"
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ApexCharts !== 'undefined' && document.getElementById("growth-chart")) {
      const options = {
        series: [
          {
            name: "Followers",
            data: displayData.followers.value,
            color: "#3B82F6" // blue-500
          },
          {
            name: "Views",
            data: displayData.views.value,
            color: "#000000" // black for light mode
          }
        ],
        chart: {
          height: 180, // Reduced from 260
          type: "area",
          fontFamily: "Inter, sans-serif",
          toolbar: {
            show: false
          },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          },
          sparkline: {
            enabled: true
          }
        },
        tooltip: {
          enabled: true,
          x: {
            show: false
          },
          y: {
            formatter: function (value: number) {
              return formatNumber(value);
            }
          },
          marker: {
            show: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: "smooth",
          width: 1
        },
        fill: {
          type: "gradient",
          gradient: {
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 100]
          }
        },
        legend: {
          show: false
        },
        grid: {
          show: false,
          padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }
        },
        xaxis: {
          labels: {
            show: false
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          show: false
        }
      };

      const chart = new window.ApexCharts(document.getElementById("growth-chart"), options);
      chart.render();

      // Cleanup function
      return () => {
        chart.destroy();
      };
    }
  }, [displayData, formatNumber]);

  return (
    <Card className="w-full rounded-xl flex flex-col">
      <CardHeader className="pb-1 px-4 pt-4 space-y-0">
        <CardTitle className="text-sm">Growth Rate</CardTitle>
        <CardDescription className="text-xs">Average metrics across all posts</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col justify-center">
        <div id="growth-chart" className="h-[180px] w-full"></div>
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-0 flex justify-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs font-medium">Followers</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-black dark:bg-white"></div>
            <span className="text-xs font-medium">Views</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 