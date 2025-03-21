"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, Clock, AlertTriangle, X } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { apiService } from "@/lib/api-service"

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiRateLimited, setApiRateLimited] = useState(false)
  const [refreshSuccess, setRefreshSuccess] = useState(true) // Track if the actual data refresh was successful

  // Check if a refresh is needed (more than 30 minutes since last refresh)
  const checkIfNeedsRefresh = (timestamp: string | null) => {
    if (!timestamp) return true;

    const lastRefreshDate = new Date(timestamp);
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    return lastRefreshDate < thirtyMinutesAgo;
  };

  useEffect(() => {
    // Get the last refresh timestamp from the API service
    const timestamp = apiService.getLastRefreshTimestamp();
    setLastRefresh(timestamp);
    setNeedsRefresh(checkIfNeedsRefresh(timestamp));

    // Check every 5 minutes if a refresh is needed
    const intervalId = setInterval(() => {
      setNeedsRefresh(checkIfNeedsRefresh(lastRefresh));
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [lastRefresh]);

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
      const data = await apiService.refreshTikTokProfiles()

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

      // Get the updated timestamp from the API service
      const timestamp = apiService.getLastRefreshTimestamp();
      setLastRefresh(timestamp);
      setNeedsRefresh(checkIfNeedsRefresh(timestamp));
    } catch (err) {
      console.error('Error refreshing accounts:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setRefreshSuccess(false)

      // Even if there's an error, we still want to update the UI with the current timestamp
      const timestamp = apiService.getLastRefreshTimestamp();
      setLastRefresh(timestamp);
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