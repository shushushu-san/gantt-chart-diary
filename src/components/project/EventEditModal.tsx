"use client"

import { useState } from "react"
import type { GanttEvent } from "@/components/gantt/GanttChart"

type Props = {
  event: GanttEvent
  projectId: string
  onClose: () => void
  onUpdated: () => void
}

function toDateInput(iso: string) {
  return iso.slice(0, 10)
}

export function EventEditModal({ event, projectId, onClose, onUpdated }: Props) {
  const [title, setTitle] = useState(event.title)
  const [summary, setSummary] = useState(event.summary ?? "")
  const [startDate, setStartDate] = useState(toDateInput(event.startDate))
  const [endDate, setEndDate] = useState(toDateInput(event.endDate))
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!title || !startDate || !endDate) {
      setError("タイトル・開始日・終了日は必須です")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, startDate, endDate }),
      })
      if (!res.ok) throw new Error(await res.text())
      onUpdated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`「${event.title}」を削除しますか？\nこの操作は取り消せません。`)) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${event.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(await res.text())
      onUpdated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">イベントを編集</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">タイトル <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">概要</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">開始日 <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">終了日 <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? "削除中..." : "このイベントを削除"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
