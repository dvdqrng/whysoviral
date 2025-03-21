import { cn } from "../lib/utils"
import { ReactNode } from "react"

interface ColumnLayoutProps {
  children: ReactNode
  className?: string
}

export function ColumnLayout({ children, className }: ColumnLayoutProps) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  )
}

export function Column({ children, className }: ColumnLayoutProps) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  )
} 