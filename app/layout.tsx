import "./globals.css"
import { Inter } from "next/font/google"
import Header from "./components/header"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "TikTok AI Analysis",
  description: "AI-powered TikTok video analysis for content creators",
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
            <Header />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

