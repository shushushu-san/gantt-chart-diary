"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ProjectFile = {
  id: string
  name: string
  url: string
  size: number | null
  subfolder: string | null
  createdAt: string
}

export function FileList({ files, projectId }: { files: ProjectFile[]; projectId: string }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function handleDelete(fileId: string, fileName: string) {
    if (!confirm(`「${fileName}」を削除しますか？\nガントチャートのデータは残ります。`)) return
    setDeletingId(fileId)
    setError("")
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
      method: "DELETE",
    })
    setDeletingId(null)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "削除に失敗しました")
      return
    }
    router.refresh()
  }

  if (files.length === 0) return null

  return (
    <div className="mt-4">
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <ul className="space-y-2">
        {files.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 border border-gray-100"
          >
            <div className="flex items-center gap-2 min-w-0">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline truncate max-w-xs"
              >
                {f.name}
              </a>
              {f.subfolder && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                  {f.subfolder}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 ml-4 shrink-0">
              <span className="text-xs text-gray-400">
                {f.size ? `${Math.round(f.size / 1024)} KB` : ""}
                {" · "}
                {new Date(f.createdAt).toLocaleDateString("ja-JP")}
              </span>
              <button
                onClick={() => handleDelete(f.id, f.name)}
                disabled={deletingId === f.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                title="削除"
              >
                {deletingId === f.id ? "削除中..." : "削除"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
