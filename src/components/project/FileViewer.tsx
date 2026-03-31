"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { SelectedFile } from "@/components/gantt/GanttChart"

type Props = {
  file: SelectedFile
  onClose: () => void
}

type FileType = "pdf" | "image" | "markdown" | "text" | "other"

function getFileType(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "pdf"
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image"
  if (ext === "md") return "markdown"
  if (["txt", "csv", "json", "log"].includes(ext)) return "text"
  return "other"
}

/** DBに保存されたURLを認証付き配信APIのURLに変換する
 *  /uploads/foo/bar.txt → /api/uploads/foo/bar.txt
 */
function toApiUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    return "/api" + url
  }
  return url
}

export function FileViewer({ file, onClose }: Props) {
  const type = getFileType(file.name)
  const apiUrl = toApiUrl(file.url)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (type === "text" || type === "markdown") {
      setLoading(true)
      setTextContent(null)
      setError(null)
      fetch(apiUrl)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.text()
        })
        .then((text) => {
          setTextContent(text)
          setLoading(false)
        })
        .catch((e) => {
          setError(`読み込みに失敗しました: ${e.message}`)
          setLoading(false)
        })
    }
  }, [apiUrl, type])

  return (
    <div className="border-t border-gray-200 bg-white flex flex-col" style={{ height: 320 }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0 bg-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
          <span className="text-xs text-gray-400 uppercase shrink-0">
            {file.name.split(".").pop()}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={apiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            別タブで開く
          </a>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-2"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-auto">
        {/* PDF */}
        {type === "pdf" && (
          <iframe
            src={apiUrl}
            className="w-full h-full border-0"
            title={file.name}
          />
        )}

        {/* 画像 */}
        {type === "image" && (
          <div className="flex items-center justify-center h-full p-4 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={apiUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded shadow"
            />
          </div>
        )}

        {/* Markdown */}
        {type === "markdown" && (
          <div className="p-4">
            {loading && <p className="text-xs text-gray-400">読み込み中...</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
            {textContent !== null && (
              <article className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {textContent}
                </ReactMarkdown>
              </article>
            )}
          </div>
        )}

        {/* プレーンテキスト */}
        {type === "text" && (
          <div className="p-4 h-full">
            {loading && <p className="text-xs text-gray-400">読み込み中...</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
            {textContent !== null && (
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                {textContent}
              </pre>
            )}
          </div>
        )}

        {/* その他 */}
        {type === "other" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <p className="text-sm">このファイルはプレビューできません</p>
            <a
              href={apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline"
            >
              ダウンロード / 別タブで開く
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
