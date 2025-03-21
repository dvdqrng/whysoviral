"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { RefreshCw } from "lucide-react"
import { usePathname } from "next/navigation"

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pathname = usePathname()

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // Determine which API to call based on the current path
      let endpoint = '/api/refresh'

      if (pathname.includes('tier2')) {
        endpoint = '/api/tiktok/refresh-all'
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }

      // Optional: reload the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="w-full flex items-center justify-center gap-1"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
    </Button>
  )
} 