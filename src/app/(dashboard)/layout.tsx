import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LogoutButton } from "@/components/auth/LogoutButton"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
            Gantt Chart Diary
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
