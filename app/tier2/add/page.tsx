"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AddAccount() {
  const [profileUrl, setProfileUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profileUrl.trim()) {
      setError('Please enter a TikTok profile URL or username')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Make a POST request to the TikTok user API endpoint
      const response = await fetch('/api/tiktok/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add TikTok account')
      }

      // If successful, redirect back to the tier2 page
      router.push('/tier2')
    } catch (err) {
      console.error('Error adding TikTok account:', err)
      setError(err.message || 'An error occurred while adding the TikTok account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Link href="/tier2" className="inline-flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to accounts
      </Link>

      <h1 className="text-2xl font-bold mb-6">Add TikTok Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="profileUrl" className="block text-sm font-medium mb-1">
            TikTok Profile URL or Username
          </label>
          <Input
            id="profileUrl"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@username or @username"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Example: https://www.tiktok.com/@tiktok or just @tiktok
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Adding Account...' : 'Add Account'}
        </Button>
      </form>
    </div>
  )
} 