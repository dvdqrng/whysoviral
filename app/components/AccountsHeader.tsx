"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

interface AccountsHeaderProps {
  profiles: any[]
  activeTab: string
  onTabChange: (tab: string) => void
  onAddAccount: () => void
}

export function AccountsHeader({
  profiles,
  activeTab,
  onTabChange,
  onAddAccount
}: AccountsHeaderProps) {
  return (
    <div className="flex space-x-4 flex-wrap gap-y-4 mb-6">
      {/* Add button */}
      <button
        onClick={onAddAccount}
        className="relative flex h-20 w-20 flex-col items-center justify-center hover:opacity-90"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
          <Plus className="h-5 w-5" />
        </div>
        <span className="mt-1 text-xs">Add</span>
        {activeTab === 'add' && <div className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500"></div>}
      </button>

      {/* All accounts button */}
      <button
        onClick={() => onTabChange('all')}
        className="relative flex h-20 w-20 flex-col items-center justify-center hover:opacity-90"
      >
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${activeTab === 'all'
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-gray-50 dark:bg-gray-800'}`}>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
        <span className="mt-1 text-xs">All</span>
        {activeTab === 'all' && <div className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500"></div>}
      </button>

      {/* Profile avatars */}
      {profiles.map(profile => (
        <button
          key={profile.user.username}
          onClick={() => onTabChange(profile.user.username)}
          className="relative flex h-20 w-20 flex-col items-center justify-center hover:opacity-100"
        >
          <div className={`flex h-14 w-14 items-center justify-center rounded-full overflow-hidden ${activeTab === profile.user.username ? '' : 'opacity-80'}`}>
            {profile.user.avatar ? (
              <img
                src={profile.user.avatar}
                alt={profile.user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-base font-semibold">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="mt-1 text-xs truncate w-full text-center">{profile.user.username}</span>
          {activeTab === profile.user.username && <div className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500"></div>}
        </button>
      ))}
    </div>
  )
} 