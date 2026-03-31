"use client"

import { useState } from "react"
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

function FolderNode({ name, files, projectId, onFileSelect, selectedFileId }: {
  name: string
  files: ProjectFile[]
  projectId: string
  onFileSelect?: (file: SelectedFile) => void
  selectedFileId?: string | null
}) {
  const [open, setOpen] = useState(true)
  const isRoot = name === "ルート"

  return (
    <div className="mb-0.5">
      {!isRoot && (
        <button
          onClick={() => setOpen(!open)}
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
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const groups = groupByFolder(files)
  const folders = Object.keys(groups).sort((a, b) => {
    if (a === "ルート") return -1
    if (b === "ルート") return 1
    return a.localeCompare(b)
  })

  return (
    <>
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
