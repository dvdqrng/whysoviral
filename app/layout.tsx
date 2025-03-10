import "./globals.css"
import { Inter } from "next/font/google"
import Header from "./components/header"
import { AuthProvider } from "@/lib/auth-context"
import type React from "react" // Added import for React

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
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}

