"use client"

import Link from "next/link"
import { ProjectDeleteButton } from "./ProjectDeleteButton"

interface ProjectCardProps {
  id: string
  name: string
  description?: string | null
  entriesCount: number
  filesCount: number
  createdAt: string
}

export function ProjectCard({ id, name, description, entriesCount, filesCount, createdAt }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group relative">
      <Link href={`/projects/${id}`} className="block p-5">
        <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 mb-1 truncate pr-12">
          {name}
        </h2>
        {description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>
        )}
        <div className="flex gap-3 text-xs text-gray-400">
          <span>タスク {entriesCount}件</span>
          <span>ファイル {filesCount}件</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(createdAt).toLocaleDateString("ja-JP")}
        </p>
      </Link>
      <div className="absolute top-3 right-3">
        <ProjectDeleteButton projectId={id} projectName={name} />
      </div>
    </div>
  )
}
