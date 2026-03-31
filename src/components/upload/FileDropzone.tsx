"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

type AISuggestion = {
  title: string
  summary: string
  startDate: string | null
  endDate: string | null
  isExplicit: boolean
}

type PendingConfirm = {
  fileId: string
  fileName: string
  suggestion: AISuggestion
  suggestedFolder: { folder: string; reason: string } | null
}

export function FileDropzone({ projectId, onClose }: { projectId: string; onClose?: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const [confirmTitle, setConfirmTitle] = useState("")
  const [confirmStart, setConfirmStart] = useState("")
  const [confirmEnd, setConfirmEnd] = useState("")
  const [confirmFolder, setConfirmFolder] = useState("")
  const [confirming, setConfirming] = useState(false)

  async function uploadFile(file: File) {
    setUploading(true)
    setError("")
    setPending(null)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: form,
    })
    setUploading(false)

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "アップロードに失敗しました")
      return
    }

    const data = await res.json()
    const { file: projectFile, aiSuggestion, suggestedFolder } = data

    if (aiSuggestion) {
      setConfirmTitle(aiSuggestion.title)
      setConfirmStart(aiSuggestion.startDate ?? "")
      setConfirmEnd(aiSuggestion.endDate ?? "")
      setConfirmFolder(suggestedFolder?.folder ?? "general")
      setPending({ fileId: projectFile.id, fileName: file.name, suggestion: aiSuggestion, suggestedFolder })
    } else {
      setConfirmTitle(file.name.replace(/\.[^.]+$/, ""))
      setConfirmStart("")
      setConfirmEnd("")
      setConfirmFolder("general")
      setPending({ fileId: projectFile.id, fileName: file.name, suggestion: { title: "", summary: "", startDate: null, endDate: null, isExplicit: false }, suggestedFolder: null })
    }

    router.refresh()
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!pending) return
    if (confirmEnd < confirmStart) {
      setError("終了日は開始日以降にしてください")
      return
    }
    setConfirming(true)
    setError("")
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: confirmTitle,
        summary: pending.suggestion.summary || null,
        startDate: confirmStart,
        endDate: confirmEnd,
        fileId: pending.fileId,
        subfolder: confirmFolder || "general",
      }),
    })
    setConfirming(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "タスク作成に失敗しました")
      return
    }
    setPending(null)
    router.refresh()
    onClose?.()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (file) uploadFile(file)
  }

  // AI確認フォーム
  if (pending) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          「{pending.fileName}」を解析しました
        </p>
        {pending.suggestion.summary && (
          <p className="text-xs text-blue-600 mb-3">{pending.suggestion.summary}</p>
        )}
        {!pending.suggestion.isExplicit && pending.suggestion.startDate && (
          <p className="text-xs text-amber-600 mb-2">
            ※ 明示的な日付がなかったため、推定値です。必要に応じて修正してください。
          </p>
        )}
        {!pending.suggestion.startDate && (
          <p className="text-xs text-amber-600 mb-2">
            ※ 日付を特定できませんでした。手動で入力してください。
          </p>
        )}
        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル</label>
            <input
              type="text"
              required
              value={confirmTitle}
              onChange={(e) => setConfirmTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {/* フォルダ確認（AI提案・ユーザーが自由に変更可能） */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              保存フォルダ名
              {pending.suggestedFolder && (
                <span className="ml-2 text-indigo-500">AI提案: {pending.suggestedFolder.reason}</span>
              )}
            </label>
            <input
              type="text"
              required
              value={confirmFolder}
              onChange={(e) => setConfirmFolder(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "-"))}
              placeholder="例: meeting-notes"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-0.5">英数字・ハイフン・アンダーバーのみ。自由に変更できます。</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
              <input
                type="date"
                required
                value={confirmStart}
                onChange={(e) => setConfirmStart(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
              <input
                type="date"
                required
                value={confirmEnd}
                onChange={(e) => setConfirmEnd(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={confirming}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {confirming ? "保存中..." : "ガントに追加"}
            </button>
            <button
              type="button"
              onClick={() => { setPending(null); setError(""); onClose?.() }}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.pdf,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
          }}
        />
        {uploading ? (
          <p className="text-sm text-gray-500">AIが解析中...</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">ここにファイルをドロップ</p>
            <p className="text-xs text-gray-400 mt-1">またはクリックして選択（PDF / TXT / MD）</p>
            <p className="text-xs text-gray-400 mt-0.5">AIが内容から期間を自動抽出します</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
