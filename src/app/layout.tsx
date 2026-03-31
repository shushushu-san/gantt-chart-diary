import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gantt Chart Diary",
  description: "AI-powered diary with Gantt chart visualization",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
