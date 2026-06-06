import type { Metadata, Viewport } from "next"
import "./globals.css"
import TabBar from "./TabBar"

export const metadata: Metadata = {
  title: "AI Planner",
  description: "AI-планер дня",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="bg-gray-950 text-white min-h-screen flex flex-col max-w-md mx-auto">
        <main className="flex-1 overflow-y-auto pb-32">{children}</main>
        <TabBar />
      </body>
    </html>
  )
}
