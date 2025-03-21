"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ColumnLayout, Column } from "@/app/components/column-layout"

export default function GroupsPage() {
  const [timeFilter, setTimeFilter] = React.useState<"1M" | "3M" | "6M" | "12M">("1M")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Groups</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          {["1M", "3M", "6M", "12M"].map((period) => (
            <Button
              key={period}
              variant={timeFilter === period ? "default" : "ghost"}
              className={`text-xs rounded-full px-4 py-1 h-auto ${timeFilter === period ? "" : "text-gray-500"
                }`}
              onClick={() => setTimeFilter(period as any)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      <ColumnLayout>
        <Column fullWidth>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Group analysis content will appear here
          </div>
        </Column>
      </ColumnLayout>
    </div>
  )
} 