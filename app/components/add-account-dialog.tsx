"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useRouter } from "next/navigation"
import { apiService } from "../lib/api-service"

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const [profileUrl, setProfileUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profileUrl.trim()) {
      setError("Please enter a TikTok profile URL or username")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Use the centralized API service to add the TikTok account
      await apiService.addTikTokAccount(profileUrl)

      // If successful, close dialog and notify parent
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }

      // Reset form
      setProfileUrl("")
    } catch (err) {
      console.error("Error adding TikTok account:", err)
      setError(err.message || "An error occurred while adding the TikTok account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add TikTok Account</DialogTitle>
          <DialogDescription>
            Enter a TikTok profile URL or username to add to your analytics
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profileUrl">TikTok Profile URL or Username</Label>
              <Input
                id="profileUrl"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username or @username"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Example: https://www.tiktok.com/@tiktok or just @tiktok
              </p>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 