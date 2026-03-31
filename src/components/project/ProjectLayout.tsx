"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GanttChart, type GanttEvent, type SelectedFile, type SelectedEvent } from "@/components/gantt/GanttChart"
import { ProjectSidebar } from "@/components/project/ProjectSidebar"
import { FileViewer } from "@/components/project/FileViewer"
import { EventEditModal } from "@/components/project/EventEditModal"

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
  tasks: GanttEvent[]
}

export function ProjectLayout({ projectId, projectName, files, tasks }: Props) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<SelectedEvent | null>(null)

  function handleFileSelect(file: SelectedFile) {
    setSelectedFile((prev) => (prev?.id === file.id ? null : file))
  }

  const handleEventSelect = useCallback((event: SelectedEvent) => {
    // 同じイベントを再クリックしたら全て閉じる
    if (selectedEvent?.id === event.id) {
      setSelectedEvent(null)
      setSelectedFile(null)
      return
    }
    setSelectedEvent(event)
    // ファイルが紐付いていればファイルビューアも開く
    if (event.fileUrl) {
      setSelectedFile({ id: event.fileId!, url: event.fileUrl, name: event.fileName! })
    } else {
      setSelectedFile(null)
    }
  }, [selectedEvent])

  function handleClosePanel() {
    setSelectedEvent(null)
    setSelectedFile(null)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左サイドバー */}
      <ProjectSidebar
        projectId={projectId}
        projectName={projectName}
        files={files}
        onFileSelect={handleFileSelect}
        selectedFileId={selectedFile?.id ?? null}
      />

      {/* 右エリア: ガントチャート + 下部パネル */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ガントチャート */}
        <main className="flex-1 overflow-auto p-6 bg-white">
          <GanttChart
            tasks={tasks}
            onFileSelect={handleFileSelect}
            onEventSelect={handleEventSelect}
            selectedFileId={selectedFile?.id ?? null}
            selectedEventId={selectedEvent?.id ?? null}
          />
        </main>

        {/* 下部パネル（イベント選択時） */}
        {selectedEvent && (
          <div className="border-t border-gray-200 bg-white shrink-0">
            {/* パネルヘッダー: イベント情報 + 編集ボタン + 閉じるボタン */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{selectedEvent.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedEvent.startDate).toLocaleDateString("ja-JP")}
                    {selectedEvent.startDate !== selectedEvent.endDate && (
                      <> 〜 {new Date(selectedEvent.endDate).toLocaleDateString("ja-JP")}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  onClick={() => setEditingEvent(selectedEvent)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                  </svg>
                  編集
                </button>
                <button
                  onClick={handleClosePanel}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* ファイルビューア */}
            {selectedFile && (
              <FileViewer
                file={selectedFile}
                onClose={handleClosePanel}
                hideCloseButton
              />
            )}
          </div>
        )}

        {/* ファイルのみ選択（サイドバーから） */}
        {!selectedEvent && selectedFile && (
          <FileViewer
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </div>

      {/* イベント編集モーダル */}
      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          projectId={projectId}
          onClose={() => setEditingEvent(null)}
          onUpdated={() => {
            setEditingEvent(null)
            setSelectedEvent(null)
            setSelectedFile(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
