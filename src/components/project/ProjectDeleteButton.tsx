"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  projectId: string
  projectName: string
  redirectTo?: string
}

export function ProjectDeleteButton({ projectId, projectName, redirectTo = "/dashboard" }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "削除に失敗しました")
      }
      router.push(redirectTo)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました")
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-500 hover:text-red-700 hover:underline transition-colors"
      >
        削除
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">プロジェクトを削除</h2>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">「{projectName}」</span> を削除しますか？
            </p>
            <p className="text-xs text-gray-400 mb-5">
              ガントチャートのデータ・アップロードファイルがすべて削除されます。この操作は取り消せません。
            </p>
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
