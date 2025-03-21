import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "./lib/auth-context"
import { ThemeProvider } from "./components/theme-provider"
import { Sidebar } from "./components/sidebar"
import type React from "react"
import Script from "next/script"

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
      <Script src="https://cdn.jsdelivr.net/npm/apexcharts@3.46.0/dist/apexcharts.min.js" strategy="afterInteractive" />
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
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white dark:bg-gray-900 w-full rounded-xl p-8 min-h-0">
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

