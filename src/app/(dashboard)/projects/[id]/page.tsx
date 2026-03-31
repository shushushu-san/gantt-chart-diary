import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { GanttChart } from "@/components/gantt/GanttChart"
import { FileDropzone } from "@/components/upload/FileDropzone"
import { NewTaskForm } from "@/components/project/NewTaskForm"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      files: { orderBy: { createdAt: "desc" } },
      entries: { include: { ganttItems: true } },
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
      categoryLabel: g.categoryLabel,
    }))
  )

  return (
    <div>
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-indigo-600">プロジェクト</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{project.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
      {project.description && (
        <p className="text-gray-500 text-sm mb-6">{project.description}</p>
      )}

      {/* ガントチャートセクション */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">ガントチャート</h2>
          <NewTaskForm projectId={project.id} />
        </div>
        <GanttChart tasks={tasks} />
      </section>

      {/* ファイルセクション */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">ファイル</h2>
        <FileDropzone projectId={project.id} />

        {project.files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {project.files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 border border-gray-100"
              >
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline truncate max-w-xs"
                >
                  {f.name}
                </a>
                <span className="text-xs text-gray-400 ml-4 shrink-0">
                  {f.size ? `${Math.round(f.size / 1024)} KB` : ""}
                  {" · "}
                  {new Date(f.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
