import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { RefreshButton } from "@/components/refresh-button"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Single Post Analysis",
      href: "/tier1",
    },
    {
      name: "Account Analysis",
      href: "/tier2",
    },
  ]

  return (
    <nav className="flex items-center space-x-6 ml-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm transition-colors hover:text-foreground/80",
            pathname === item.href
              ? "text-foreground font-medium"
              : "text-foreground/60"
          )}
        >
          {item.name}
        </Link>
      ))}

      {/* Only show the refresh button on the Account Analysis page */}
      {pathname === "/tier2" && (
        <div className="ml-4">
          <RefreshButton />
        </div>
      )}
    </nav>
  )
} 