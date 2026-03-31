import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { NewProjectForm } from "@/components/project/NewProjectForm"
import { ProjectCard } from "@/components/project/ProjectCard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const projects = await prisma.project.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { files: true, entries: true } } },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 overflow-y-auto h-full">
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
            <ProjectCard
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              entriesCount={p._count.entries}
              filesCount={p._count.files}
              createdAt={p.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  )
}
