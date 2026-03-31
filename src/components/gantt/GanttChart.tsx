"use client"

import { useMemo, useState } from "react"

export type GanttEvent = {
  id: string
  title: string
  summary: string | null
  startDate: string
  endDate: string
  categoryLabel: string | null
  fileId: string | null
  fileUrl: string | null
  fileName: string | null
}

export type SelectedFile = {
  id: string
  url: string
  name: string
}

export type SelectedEvent = GanttEvent

const ROW_COLORS: Record<string, string> = {
  仕事: "#6366f1",
  学習: "#10b981",
  健康: "#f59e0b",
  趣味: "#ec4899",
  個人: "#3b82f6",
  未分類: "#9ca3af",
}

function getColor(label: string | null) {
  if (!label) return "#6366f1"
  return ROW_COLORS[label] ?? "#6366f1"
}

// ホバー時のツールチップ
function Tooltip({ event, leftPct }: { event: GanttEvent; leftPct: number }) {
  const date = new Date(event.startDate).toLocaleDateString("ja-JP")
  // 右端に近い場合は左寄せにする
  const alignRight = leftPct > 70
  return (
    <div
      className={`absolute z-50 bottom-full mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none ${
        alignRight ? "right-0" : "left-0"
      }`}
    >
      <p className="font-semibold text-sm mb-1">{event.title}</p>
      <p className="text-gray-300 mb-1">{date}</p>
      {event.summary && <p className="text-gray-200 leading-relaxed">{event.summary}</p>}
    </div>
  )
}

// イベントマーカー（円）
function EventMarker({ event, viewStartMs, totalDays, onFileSelect, onEventSelect, selected }: {
  event: GanttEvent
  viewStartMs: number
  totalDays: number
  onFileSelect?: (file: SelectedFile) => void
  onEventSelect?: (event: SelectedEvent) => void
  selected?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const rangeMs = totalDays * 86400000
  const eventMs = new Date(event.startDate).getTime()
  const leftPct = ((eventMs - viewStartMs) / rangeMs) * 100

  if (leftPct < -2 || leftPct > 102) return null

  const color = getColor(event.categoryLabel)
  const hasFile = !!event.fileUrl
  const isActive = selected || hovered

  function handleClick() {
    // イベント選択を通知（常に）
    onEventSelect?.(event)
    // ファイルがあればファイルビューアも開く
    if (hasFile && onFileSelect) {
      onFileSelect({ id: event.fileId!, url: event.fileUrl!, name: event.fileName! })
    }
  }

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
      style={{ left: `${leftPct}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* 外側のリング */}
      <div
        className={`rounded-full border-2 flex items-center justify-center transition-transform duration-150 ${
          isActive ? "scale-150" : "scale-100"
        }`}
        style={{
          width: 16,
          height: 16,
          borderColor: color,
          backgroundColor: isActive ? color : "white",
          boxShadow: selected ? `0 0 0 3px ${color}44` : undefined,
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            backgroundColor: color,
            opacity: isActive ? 0 : 1,
          }}
        />
      </div>
      {/* ファイルあり：小さなクリップアイコン */}
      {hasFile && !isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      {/* ツールチップ */}
      {hovered && <Tooltip event={event} leftPct={leftPct} />}
    </div>
  )
}

// 今日の縦線
function TodayLine({ viewStartMs, totalDays }: { viewStartMs: number; totalDays: number }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const leftPct = ((today.getTime() - viewStartMs) / (totalDays * 86400000)) * 100
  if (leftPct < 0 || leftPct > 100) return null
  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-red-400 z-10 pointer-events-none"
      style={{ left: `${leftPct}%` }}
    />
  )
}

export function GanttChart({ tasks, onFileSelect, onEventSelect, selectedFileId, selectedEventId }: {
  tasks: GanttEvent[]
  onFileSelect?: (file: SelectedFile) => void
  onEventSelect?: (event: SelectedEvent) => void
  selectedFileId?: string | null
  selectedEventId?: string | null
}) {
  // 表示範囲をイベントの最小・最大日付から動的に計算
  const { viewStart, totalDays } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (tasks.length === 0) {
      const d = new Date(today)
      d.setDate(d.getDate() - 15)
      return { viewStart: d, totalDays: 60 }
    }

    const dates = tasks.flatMap((t) => [
      new Date(t.startDate).getTime(),
      new Date(t.endDate).getTime(),
    ])
    const minMs = Math.min(...dates)
    const maxMs = Math.max(...dates, today.getTime())

    // 前後に余白（14日）を追加
    const pad = 14 * 86400000
    const start = new Date(minMs - pad)
    start.setHours(0, 0, 0, 0)
    const end = new Date(maxMs + pad)
    end.setHours(0, 0, 0, 0)

    const totalDays = Math.max(60, Math.ceil((end.getTime() - start.getTime()) / 86400000))
    return { viewStart: start, totalDays }
  }, [tasks])

  const viewStartMs = viewStart.getTime()
  const viewEndMs = viewStartMs + totalDays * 86400000

  // 月ラベル
  const months = useMemo(() => {
    const result: { label: string; leftPct: number }[] = []
    const d = new Date(viewStart)
    d.setDate(1)
    while (d.getTime() < viewEndMs) {
      const leftPct = ((d.getTime() - viewStartMs) / (totalDays * 86400000)) * 100
      result.push({ label: `${d.getFullYear()}/${d.getMonth() + 1}`, leftPct: Math.max(0, leftPct) })
      d.setMonth(d.getMonth() + 1)
    }
    return result
  }, [viewStart, viewStartMs, viewEndMs, totalDays])

  // カテゴリ行にグループ化（カテゴリなしは「プロジェクト」まとめ）
  const rows = useMemo(() => {
    const map = new Map<string, GanttEvent[]>()
    for (const t of tasks) {
      const key = t.categoryLabel ?? "イベント"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        ファイルをアップロードするとここにイベントが表示されます
      </div>
    )
  }

  return (
    <div className="overflow-x-auto select-none">
      {/* 月ラベルヘッダー */}
      <div className="relative h-7 border-b border-gray-100 mb-2 ml-28">
        {months.map((m) => (
          <span
            key={m.label}
            className="absolute top-1 text-xs text-gray-400"
            style={{ left: `${m.leftPct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* 行ごとに水平線 + イベントマーカー */}
      {Array.from(rows.entries()).map(([rowLabel, events]) => (
        <div key={rowLabel} className="flex items-center mb-5">
          {/* 行ラベル */}
          <div className="w-28 shrink-0 text-xs font-medium text-gray-500 truncate pr-3">
            {rowLabel}
          </div>
          {/* タイムライン */}
          <div className="flex-1 relative h-10">
            <TodayLine viewStartMs={viewStartMs} totalDays={totalDays} />
            {/* 水平線 */}
            <div
              className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
              style={{ backgroundColor: getColor(events[0]?.categoryLabel) + "55" }}
            />
            {/* イベントマーカー */}
            {events.map((event) => (
              <EventMarker
                key={event.id}
                event={event}
                viewStartMs={viewStartMs}
                totalDays={totalDays}
                onFileSelect={onFileSelect}
                onEventSelect={onEventSelect}
                selected={event.id === selectedEventId || (!!event.fileId && event.fileId === selectedFileId)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
