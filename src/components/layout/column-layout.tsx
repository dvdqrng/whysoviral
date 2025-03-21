import { cn } from "../../lib/utils"
import { ReactNode } from "react"

interface ColumnLayoutProps {
  children: ReactNode
  className?: string
}

export function ColumnLayout({ children, className }: ColumnLayoutProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {children}
    </div>
  )
}

interface ColumnProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function Column({ children, className, fullWidth }: ColumnProps) {
  return (
    <div className={cn(
      "rounded-lg border p-4",
      fullWidth && "md:col-span-2 lg:col-span-3",
      className
    )}>
      {children}
    </div>
  )
} 