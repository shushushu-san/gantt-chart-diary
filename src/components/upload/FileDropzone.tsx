"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export function FileDropzone({ projectId }: { projectId: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  async function uploadFile(file: File) {
    setUploading(true)
    setMessage("")
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: form,
    })
    setUploading(false)
    if (res.ok) {
      setMessage(`「${file.name}」をアップロードしました`)
      router.refresh()
    } else {
      const d = await res.json()
      setMessage(d.error ?? "アップロードに失敗しました")
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    if (files.length > 1) {
      setMessage("複数のファイルがドロップされました。最初の1つのみアップロードされます。")
    }
    const file = files[0]
    if (file) uploadFile(file)
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
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
          }}
        />
        {uploading ? (
          <p className="text-sm text-gray-500">アップロード中...</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">ここにファイルをドロップ</p>
            <p className="text-xs text-gray-400 mt-1">またはクリックして選択</p>
          </>
        )}
      </div>
      {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
    </div>
  )
}
