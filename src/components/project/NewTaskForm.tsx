"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  projectId: string
  /** 提供された場合はモーダル埋め込みモード（常にフォーム表示・Cancel で呼び出し） */
  onClose?: () => void
}

export function NewTaskForm({ projectId, onClose }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(!!onClose)
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleCancel() {
    setOpen(false)
    setTitle("")
    setStartDate("")
    setEndDate("")
    setError("")
    onClose?.()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (endDate < startDate) {
      setError("終了日は開始日以降にしてください")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, startDate, endDate }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "作成に失敗しました")
      return
    }
    setTitle("")
    setStartDate("")
    setEndDate("")
    setOpen(false)
    router.refresh()
    onClose?.()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
      >
        + 手動でタスクを追加
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">タスク名</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="例: 論文執筆"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "追加中..." : "追加"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 bg-white text-gray-600 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
