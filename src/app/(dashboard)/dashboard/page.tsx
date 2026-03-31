import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { NewProjectForm } from "@/components/project/NewProjectForm"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const projects = await prisma.project.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { files: true, entries: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">プロジェクト</h1>
        <NewProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">プロジェクトがまだありません</p>
          <p className="text-sm">「新規プロジェクト」から作成してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="bg-white p-5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 mb-1 truncate">
                {p.name}
              </h2>
              {p.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>
              )}
              <div className="flex gap-3 text-xs text-gray-400">
                <span>タスク {p._count.entries}件</span>
                <span>ファイル {p._count.files}件</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(p.createdAt).toLocaleDateString("ja-JP")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
