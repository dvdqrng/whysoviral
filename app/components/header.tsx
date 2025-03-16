"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { MainNav } from "./nav"

export default function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="w-full border-b">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-sm font-medium">WSV</span>
          </Link>
          <MainNav />
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          {!loading && (
            <>
              {user ? (
                <Button variant="ghost" onClick={handleSignOut} size="sm">
                  Sign Out
                </Button>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="font-medium">
                    Signup
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

