"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, Clock, AlertTriangle, X } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiRateLimited, setApiRateLimited] = useState(false)
  const [refreshSuccess, setRefreshSuccess] = useState(true) // Track if the actual data refresh was successful

  const checkRefreshStatus = async () => {
    try {
      const response = await fetch('/api/tiktok/refresh-all')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLastRefresh(data.lastRefreshTime)
          setNeedsRefresh(data.needsRefresh)
        }
      }
    } catch (error) {
      console.error('Error checking refresh status:', error)
    }
  }

  // Only check refresh status on component mount, no auto-refresh
  useEffect(() => {
    checkRefreshStatus()

    // Remove auto-refresh functionality
    // const checkAndRefreshIfNeeded = async () => {
    //   await checkRefreshStatus()
    //   if (needsRefresh) {
    //     handleRefresh()
    //   }
    // }

    // checkAndRefreshIfNeeded()

    // Remove periodic refresh checks
    // const timer = setInterval(checkRefreshStatus, 30 * 60 * 1000)
    // return () => clearInterval(timer)
  }, [])

  const formatLastRefresh = () => {
    if (!lastRefresh) return 'Never updated'

    try {
      return `Updated ${formatDistanceToNow(new Date(lastRefresh), { addSuffix: true })}`
    } catch (err) {
      console.error('Error formatting date:', err)
      return 'Date error'
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    setApiRateLimited(false)
    setRefreshSuccess(true)

    try {
      const response = await fetch('/api/tiktok/refresh-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      // Check for API errors in the response
      if (data.rateLimited || (data.details && data.details.includes("Too Many Requests")) ||
        (data.error && data.error.includes("rate limit"))) {
        setApiRateLimited(true)
        setError("TikTok API rate limit exceeded")
        setRefreshSuccess(false)
      } else if (data.refreshedCount === 0 || data.dataChanged === false) {
        // If no accounts were refreshed or no data was changed, consider it a partial failure
        setError(data.refreshedCount === 0
          ? "No accounts were refreshed"
          : "Data fetched but no changes were made")
        setRefreshSuccess(false)
      }

      // Update timestamp regardless of result since this is stored separately
      if (data.lastRefreshTime) {
        setLastRefresh(data.lastRefreshTime)
        setNeedsRefresh(false)
      } else if (response.ok) {
        // If we don't have a lastRefreshTime but the request was successful,
        // update the time to now
        setLastRefresh(new Date().toISOString())
        setNeedsRefresh(false)
      }

      if (!response.ok) {
        setError(data.error || 'Unknown error refreshing accounts')
        setRefreshSuccess(false)
      }
    } catch (err) {
      console.error('Error refreshing accounts:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setRefreshSuccess(false)

      // Even if the request fails, update the UI as if we refreshed
      setLastRefresh(new Date().toISOString())
      setNeedsRefresh(false)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`text-xs ${needsRefresh ? 'border-yellow-500' : ''} ${apiRateLimited ? 'border-red-500' : ''} ${!refreshSuccess && !apiRateLimited ? 'border-orange-500' : ''}`}
          >
            {isRefreshing ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : apiRateLimited ? (
              <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
            ) : !refreshSuccess ? (
              <X className="h-3 w-3 mr-1 text-orange-500" />
            ) : needsRefresh ? (
              <Clock className="h-3 w-3 mr-1 text-yellow-500" />
            ) : (
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            )}
            {isRefreshing ? 'Refreshing...' :
              apiRateLimited ? 'Rate Limited' :
                !refreshSuccess ? 'Refresh Failed' :
                  formatLastRefresh()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {apiRateLimited
              ? 'TikTok API rate limit exceeded. Try again later.'
              : !refreshSuccess
                ? 'Failed to refresh data. The timestamp is updated but no new data was fetched.'
                : needsRefresh
                  ? 'Data is outdated. Click to refresh all accounts.'
                  : 'Click to manually refresh all accounts data.'}
          </p>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 