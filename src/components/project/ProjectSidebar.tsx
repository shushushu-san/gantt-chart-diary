"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileDropzone } from "@/components/upload/FileDropzone"
import { FileList } from "@/components/upload/FileList"
import { NewTaskForm } from "@/components/project/NewTaskForm"
import { ProjectDeleteButton } from "@/components/project/ProjectDeleteButton"
import { AISettingsModal } from "@/components/settings/AISettingsModal"
import type { SelectedFile } from "@/components/gantt/GanttChart"

type ProjectFile = {
  id: string
  name: string
  url: string
  size: number | null
  subfolder: string | null
  createdAt: string
}

type ContextMenuState =
  | { kind: "folder"; x: number; y: number; folderName: string }
  | { kind: "file"; x: number; y: number; file: ProjectFile }

type Props = {
  projectId: string
  projectName: string
  files: ProjectFile[]
  onFileSelect?: (file: SelectedFile) => void
  selectedFileId?: string | null
}

// ファイルをサブフォルダごとにグループ化
function groupByFolder(files: ProjectFile[]): Record<string, ProjectFile[]> {
  const groups: Record<string, ProjectFile[]> = {}
  for (const f of files) {
    const key = f.subfolder ?? "ルート"
    if (!groups[key]) groups[key] = []
    groups[key].push(f)
  }
  return groups
}

function FolderNode({ name, files, projectId, onFileSelect, selectedFileId, onContextMenu, onFileContextMenu }: {
  name: string
  files: ProjectFile[]
  projectId: string
  onFileSelect?: (file: SelectedFile) => void
  selectedFileId?: string | null
  onContextMenu?: (e: React.MouseEvent, folderName: string) => void
  onFileContextMenu?: (e: React.MouseEvent, file: ProjectFile) => void
}) {
  const [open, setOpen] = useState(true)
  const isRoot = name === "ルート"

  return (
    <div className="mb-0.5">
      {!isRoot && (
        <button
          onClick={() => setOpen(!open)}
          onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, name) }}
          className="flex items-center gap-1 w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs text-gray-700 font-semibold"
        >
          <span className="text-gray-400 text-[10px]">{open ? "▾" : "▸"}</span>
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="truncate">{name}</span>
        </button>
      )}
      {(open || isRoot) && (
        <div className={isRoot ? "" : "pl-4 border-l border-gray-200 ml-3"}>
          {files.map((f) => (
            <button
              key={f.id}
              onClick={() => onFileSelect?.({ id: f.id, url: f.url, name: f.name })}
              onContextMenu={(e) => { e.preventDefault(); onFileContextMenu?.(e, f) }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs text-left w-full group transition-colors ${
                selectedFileId === f.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "hover:bg-gray-100 text-gray-600 hover:text-indigo-600"
              }`}
              title={f.name}
            >
              <svg className={`w-3.5 h-3.5 shrink-0 ${
                selectedFileId === f.id ? "text-indigo-400" : "text-gray-400 group-hover:text-indigo-400"
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{f.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type ModalType = "upload" | "event" | "settings" | null

export function ProjectSidebar({ projectId, projectName, files, onFileSelect, selectedFileId }: Props) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null) // フォルダ名
  const [renameValue, setRenameValue] = useState("")
  const [renameLoading, setRenameLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  // ファイル操作用
  const [fileRenaming, setFileRenaming] = useState<ProjectFile | null>(null)
  const [fileRenameValue, setFileRenameValue] = useState("")
  const [fileRenameLoading, setFileRenameLoading] = useState(false)
  const [fileDeleteTarget, setFileDeleteTarget] = useState<ProjectFile | null>(null)
  const [fileDeleteLoading, setFileDeleteLoading] = useState(false)
  const fileRenameInputRef = useRef<HTMLInputElement>(null)

  const groups = groupByFolder(files)
  const folders = Object.keys(groups).sort((a, b) => {
    if (a === "ルート") return -1
    if (b === "ルート") return 1
    return a.localeCompare(b)
  })

  // コンテキストメニューを閉じる
  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    const handler = () => closeContextMenu()
    window.addEventListener("click", handler)
    window.addEventListener("blur", handler)
    return () => {
      window.removeEventListener("click", handler)
      window.removeEventListener("blur", handler)
    }
  }, [contextMenu, closeContextMenu])

  function handleContextMenu(e: React.MouseEvent, folderName: string) {
    setContextMenu({ kind: "folder", x: e.clientX, y: e.clientY, folderName })
  }

  function handleFileContextMenu(e: React.MouseEvent, file: ProjectFile) {
    setContextMenu({ kind: "file", x: e.clientX, y: e.clientY, file })
  }

  // フォルダ: リネーム開始
  function startRename(folderName: string) {
    setRenaming(folderName)
    setRenameValue(folderName)
    setContextMenu(null)
    setTimeout(() => renameInputRef.current?.select(), 50)
  }

  // フォルダ: リネーム確定
  async function submitRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renaming || !renameValue.trim() || renameValue === renaming) {
      setRenaming(null)
      return
    }
    setRenameLoading(true)
    await fetch(`/api/projects/${projectId}/files`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subfolder: renaming, newSubfolder: renameValue.trim() }),
    })
    setRenameLoading(false)
    setRenaming(null)
    router.refresh()
  }

  // フォルダ: 削除確定
  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await fetch(`/api/projects/${projectId}/files?subfolder=${encodeURIComponent(deleteTarget)}`, {
      method: "DELETE",
    })
    setDeleteLoading(false)
    setDeleteTarget(null)
    router.refresh()
  }

  // ファイル: リネーム開始
  function startFileRename(file: ProjectFile) {
    setFileRenaming(file)
    setFileRenameValue(file.name)
    setContextMenu(null)
    setTimeout(() => fileRenameInputRef.current?.select(), 50)
  }

  // ファイル: リネーム確定
  async function submitFileRename(e: React.FormEvent) {
    e.preventDefault()
    if (!fileRenaming || !fileRenameValue.trim()) { setFileRenaming(null); return }
    setFileRenameLoading(true)
    await fetch(`/api/projects/${projectId}/files/${fileRenaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fileRenameValue.trim() }),
    })
    setFileRenameLoading(false)
    setFileRenaming(null)
    router.refresh()
  }

  // ファイル: 削除確定
  async function confirmFileDelete() {
    if (!fileDeleteTarget) return
    setFileDeleteLoading(true)
    await fetch(`/api/projects/${projectId}/files/${fileDeleteTarget.id}`, { method: "DELETE" })
    setFileDeleteLoading(false)
    setFileDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      {/* コンテキストメニュー */}
      {contextMenu && (
        <div
          className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-44 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.kind === "folder" ? (
            <>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => startRename(contextMenu.folderName)}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                フォルダ名を変更
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600"
                onClick={() => { setDeleteTarget(contextMenu.folderName); setContextMenu(null) }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                フォルダを削除
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => startFileRename(contextMenu.file)}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                ファイル名を変更
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600"
                onClick={() => { setFileDeleteTarget(contextMenu.file); setContextMenu(null) }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                ファイルを削除
              </button>
            </>
          )}
        </div>
      )}

      {/* フォルダ名変更ダイアログ */}
      {renaming && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">フォルダ名を変更</h3>
            <form onSubmit={submitRename} className="space-y-3">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value.replace(/[\x00-\x1f\\<>:"|?*]/g, "-").replace(/\/+/g, "/").replace(/^\//, ""))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="新しいフォルダ名"
                required
              />
              <p className="text-xs text-gray-400">英数字・ハイフン・アンダーバー・スラッシュ（/）が使用できます。</p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setRenaming(null)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">キャンセル</button>
                <button type="submit" disabled={renameLoading} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {renameLoading ? "変更中..." : "変更する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* フォルダ削除確認ダイアログ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">フォルダを削除</h3>
            <p className="text-sm text-gray-600 mb-1">
              「<span className="font-medium text-gray-800">{deleteTarget}</span>」を削除しますか？
            </p>
            <p className="text-xs text-red-500 mb-4">フォルダ内のすべてのファイルが削除されます。この操作は取り消せません。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">キャンセル</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ファイル名変更ダイアログ */}
      {fileRenaming && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">ファイル名を変更</h3>
            <form onSubmit={submitFileRename} className="space-y-3">
              <input
                ref={fileRenameInputRef}
                type="text"
                value={fileRenameValue}
                onChange={(e) => setFileRenameValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="新しいファイル名"
                required
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setFileRenaming(null)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">キャンセル</button>
                <button type="submit" disabled={fileRenameLoading} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {fileRenameLoading ? "変更中..." : "変更する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ファイル削除確認ダイアログ */}
      {fileDeleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">ファイルを削除</h3>
            <p className="text-sm text-gray-600 mb-1">
              「<span className="font-medium text-gray-800">{fileDeleteTarget.name}</span>」を削除しますか？
            </p>
            <p className="text-xs text-red-500 mb-4">この操作は取り消せません。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setFileDeleteTarget(null)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">キャンセル</button>
              <button onClick={confirmFileDelete} disabled={fileDeleteLoading} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {fileDeleteLoading ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* サイドバー本体 */}
      <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 w-60 shrink-0">
        {/* ヘッダー */}
        <div className="px-3 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-gray-800 truncate" title={projectName}>
              {projectName}
            </h2>
            <ProjectDeleteButton projectId={projectId} projectName={projectName} />
          </div>
        </div>

        {/* ファイルツリー */}
        <div className="flex-1 overflow-y-auto py-2 px-1">
          {folders.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">ファイルなし</p>
          ) : (
            folders.map((folder) => (
              <FolderNode
                key={folder}
                name={folder}
                files={groups[folder]}
                projectId={projectId}
                onFileSelect={onFileSelect}
                selectedFileId={selectedFileId}
                onContextMenu={handleContextMenu}
                onFileContextMenu={handleFileContextMenu}
              />
            ))
          )}
        </div>

        {/* 下部ボタン */}
        <div className="p-3 border-t border-gray-200 space-y-2 bg-white">
          <button
            onClick={() => setActiveModal("event")}
            className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            イベントを追加
          </button>
          <button
            onClick={() => setActiveModal("upload")}
            className="w-full px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            ファイルを追加
          </button>
          <button
            onClick={() => setActiveModal("settings")}
            className="w-full px-3 py-2 bg-white text-gray-500 text-sm font-medium rounded-md border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            AI設定
          </button>
        </div>
      </div>

      {/* AI設定モーダル（独立したオーバーレイ） */}
      {activeModal === "settings" && (
        <AISettingsModal onClose={() => setActiveModal(null)} />
      )}

      {/* イベント・ファイルモーダルオーバーレイ */}
      {(activeModal === "event" || activeModal === "upload") && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-base font-semibold text-gray-900">
                {activeModal === "event" ? "イベントを追加" : "ファイルを追加"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-5">
              {activeModal === "event" ? (
                <NewTaskForm
                  projectId={projectId}
                  onClose={() => setActiveModal(null)}
                />
              ) : (
                <>
                  <FileDropzone
                    projectId={projectId}
                    onClose={() => setActiveModal(null)}
                    existingFolders={folders.filter((f) => f !== "ルート")}
                  />
                  <FileList
                    projectId={projectId}
                    files={files}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
