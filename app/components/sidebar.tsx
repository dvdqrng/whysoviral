"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Home, Users, FolderOpen, Video, Check, Globe } from "lucide-react"
import { checkAndRefreshDataIfNeeded } from '@/lib/refresh-helper'
import { useState, useEffect } from 'react'

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [accountsCount, setAccountsCount] = useState(0)

  useEffect(() => {
    // Fetch accounts count on component mount
    const fetchAccountsCount = async () => {
      try {
        const response = await fetch('/api/tiktok/profiles')
        const data = await response.json()

        if (data.success && data.data) {
          setAccountsCount(data.data.length)
        }
      } catch (error) {
        console.error('Error fetching accounts count:', error)
      }
    }

    fetchAccountsCount()
  }, [])

  const navItems: NavItem[] = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="w-4 h-4 mr-2" />,
      disabled: true,
    },
    {
      name: "Accounts",
      href: "/tier2",
      icon: <Users className="w-4 h-4 mr-2" />,
      count: accountsCount,
    },
    {
      name: "Groups",
      href: "/tier2/groups",
      icon: <FolderOpen className="w-4 h-4 mr-2" />,
      disabled: true,
    },
    {
      name: "Videos",
      href: "/tier1",
      icon: <Video className="w-4 h-4 mr-2" />,
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const refreshData = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      // Only make a direct POST request to refresh data when button is clicked
      // Remove the call to checkAndRefreshDataIfNeeded() which causes automatic refreshes
      const refreshResponse = await fetch('/api/tiktok/refresh-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (refreshResponse.ok) {
        console.log('Manual refresh completed successfully')

        // After refresh, update the accounts count
        const response = await fetch('/api/tiktok/profiles')
        const data = await response.json()

        if (data.success && data.data) {
          setAccountsCount(data.data.length)
        }
      }
    } catch (error) {
      console.error('Error during refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="sticky top-0 h-screen flex flex-col w-64 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center">
          <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
            <Globe className="h-3 w-3 text-white" />
          </div>
        </Link>
        <ThemeSwitcher />
      </div>

      <nav className="flex flex-col space-y-1 flex-1">
        {navItems.map((item) => (
          item.disabled ? (
            <div
              key={item.href}
              className="flex items-center px-3 py-2 text-sm rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed"
            >
              {item.icon}
              <span>{item.name}</span>
              {item.count !== undefined && (
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{item.count}</span>
              )}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",
                (pathname === item.href || pathname.startsWith(`${item.href}/`))
                  ? "bg-gray-200 dark:bg-gray-700 font-medium"
                  : "text-gray-700 dark:text-gray-300"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.count !== undefined && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{item.count}</span>
              )}
            </Link>
          )
        ))}
      </nav>

      <div className="flex flex-col space-y-3 mt-auto">
        <button
          onClick={refreshData}
          className="flex items-center text-xs text-green-600 dark:text-green-400 py-2 px-3 rounded border border-transparent hover:border-green-200 dark:hover:border-green-800 transition-colors"
          disabled={isRefreshing}
        >
          <Check className="h-4 w-4 mr-2" />
          <span>{isRefreshing ? "Refreshing..." : "Updated 1 hour ago"}</span>
        </button>

        {loading ? (
          <div className="flex items-center space-x-3 px-3 py-2 rounded-md">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
            <div className="flex-1 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        ) : user ? (
          <div className="flex items-center space-x-3 px-3 py-2 rounded-md">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              aria-label="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        ) : (
          <Button onClick={() => router.push('/auth')} variant="outline" size="sm" className="w-full justify-start">
            Sign In / Sign Up
          </Button>
        )}
      </div>
    </div>
  )
} 