"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="bg-gray-800 text-white">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
            </li>
            {user && (
              <>
                <li>
                  <Link href="/tier1" className="hover:text-gray-300">
                    Single Video Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/tier2" className="hover:text-gray-300">
                    Account Analysis
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div>
            {!loading &&
              (user ? (
                <div className="flex items-center space-x-4">
                  <span>{user.email}</span>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              ))}
          </div>
        </div>
      </nav>
    </header>
  )
}

