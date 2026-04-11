import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ProjectLayout } from "@/components/project/ProjectLayout"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      files: { orderBy: { createdAt: "desc" } },
      entries: {
        include: {
          ganttItems: true,
          projectFile: true,
        },
      },
    },
  })
  if (!project) notFound()

  const tasks = project.entries.flatMap((e) =>
    e.ganttItems.map((g) => ({
      id: g.id,
      title: g.title,
      summary: g.summary,
      startDate: g.startDate.toISOString(),
      endDate: g.endDate.toISOString(),
      subfolder: e.projectFile?.subfolder ?? null,
      categoryLabel: g.categoryLabel,
      fileId: e.projectFile?.id ?? null,
      fileUrl: e.projectFile?.url ?? null,
      fileName: e.projectFile?.name ?? null,
    }))
  )

  const files = project.files.map((f) => ({
    id: f.id,
    name: f.name,
    url: f.url,
    size: f.size,
    subfolder: f.subfolder,
    createdAt: f.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-col h-full">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-500 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <Link href="/dashboard" className="hover:text-indigo-600">プロジェクト</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{project.name}</span>
      </div>

      {/* メインエリア: サイドバー + ガントチャート + ファイルビューア */}
      <ProjectLayout
        projectId={project.id}
        projectName={project.name}
        files={files}
        tasks={tasks}
      />
    </div>
  )
}
