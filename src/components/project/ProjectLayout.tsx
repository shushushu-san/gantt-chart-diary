"use client"

import { useState } from "react"
import { GanttChart, type GanttEvent, type SelectedFile } from "@/components/gantt/GanttChart"
import { ProjectSidebar } from "@/components/project/ProjectSidebar"
import { FileViewer } from "@/components/project/FileViewer"

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
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)

  function handleFileSelect(file: SelectedFile) {
    // 同じファイルを再クリックしたら閉じる
    setSelectedFile((prev) => (prev?.id === file.id ? null : file))
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

      {/* 右エリア: ガントチャート + ファイルビューア */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ガントチャート */}
        <main className="flex-1 overflow-auto p-6 bg-white">
          <GanttChart
            tasks={tasks}
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFile?.id ?? null}
          />
        </main>

        {/* ファイルビューア（ファイル選択時にスライドイン） */}
        {selectedFile && (
          <FileViewer
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </div>
    </div>
  )
}
