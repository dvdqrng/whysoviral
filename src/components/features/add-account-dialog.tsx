"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { apiService } from "@/lib/api-service"

type AddAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const [profileUrl, setProfileUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetState = () => {
    setProfileUrl('')
    setError(null)
    setSuccess(false)
  }

  const handleOpenChange = (open: boolean) => {
    // Reset form state when dialog is closed
    if (!open) {
      resetState()
    }
    onOpenChange(open)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profileUrl.trim()) {
      setError('Please enter a TikTok profile URL or username')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Use the centralized API service to add the TikTok account
      await apiService.addTikTokAccount(profileUrl)

      // Set success state
      setSuccess(true)
      setProfileUrl('')

      // Optional callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500) // Give user time to see success message
      }
    } catch (err) {
      console.error('Error adding TikTok account:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while adding the account')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add TikTok Account</DialogTitle>
          <DialogDescription>
            Enter a TikTok profile URL or username to add to your account list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              id="profileUrl"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@username or @username"
              disabled={loading || success}
              className={error ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Example: https://www.tiktok.com/@tiktok or just @tiktok
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Account added successfully!</span>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || success || !profileUrl.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? 'Added!' : loading ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 