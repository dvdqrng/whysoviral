import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "./components/sidebar"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Why So Viral - TikTok Analytics",
  description: "AI-powered insights to make your TikTok content go viral",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
              <Sidebar />
              <div className="flex-1 p-2 overflow-y-auto">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm h-full p-8 overflow-y-auto">
                  {children}
                </div>
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

