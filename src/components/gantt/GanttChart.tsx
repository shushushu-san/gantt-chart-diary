"use client"

import { useMemo } from "react"

export type GanttTask = {
  id: string
  title: string
  startDate: string
  endDate: string
  categoryLabel: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  仕事: "#6366f1",
  学習: "#10b981",
  健康: "#f59e0b",
  趣味: "#ec4899",
  個人: "#3b82f6",
  未分類: "#9ca3af",
}

function getColor(label: string | null) {
  if (!label) return "#9ca3af"
  return CATEGORY_COLORS[label] ?? "#6366f1"
}

function TodayLine({ viewStartMs, totalDays }: { viewStartMs: number; totalDays: number }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const leftPct = ((today.getTime() - viewStartMs) / (totalDays * 86400000)) * 100
  if (leftPct < 0 || leftPct > 100) return null
  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 pointer-events-none"
      style={{ left: `${leftPct}%` }}
    />
  )
}

export function GanttChart({ tasks }: { tasks: GanttTask[] }) {
  const totalDays = 60

  const viewStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 15)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const viewStartMs = viewStart.getTime()
  const viewEndMs = viewStartMs + totalDays * 86400000

  const months = useMemo(() => {
    const result: { label: string; leftPct: number }[] = []
    const d = new Date(viewStart)
    d.setDate(1)
    while (d.getTime() < viewEndMs) {
      const leftPct = ((d.getTime() - viewStartMs) / (totalDays * 86400000)) * 100
      result.push({
        label: `${d.getFullYear()}/${d.getMonth() + 1}`,
        leftPct: Math.max(0, leftPct),
      })
      d.setMonth(d.getMonth() + 1)
    }
    return result
  }, [viewStart, viewStartMs, viewEndMs, totalDays])

  const categories = useMemo(() => {
    const map = new Map<string, GanttTask[]>()
    for (const t of tasks) {
      const key = t.categoryLabel ?? "未分類"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        タスクがまだありません。「新規タスク」から追加してください。
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {/* ヘッダー（月ラベル） */}
      <div className="relative h-7 border-b border-gray-100 mb-1 ml-28">
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

      {/* カテゴリ行 */}
      {Array.from(categories.entries()).map(([cat, items]) => (
        <div key={cat} className="flex items-center mb-3">
          <div className="w-28 shrink-0 text-xs font-medium text-gray-500 truncate pr-2">
            {cat}
          </div>
          <div className="flex-1 relative h-8">
            <TodayLine viewStartMs={viewStartMs} totalDays={totalDays} />
            {items.map((task) => {
              const startMs = new Date(task.startDate).getTime()
              const endMs = new Date(task.endDate).getTime()
              const rangeMs = totalDays * 86400000
              const leftPct = Math.max(0, ((startMs - viewStartMs) / rangeMs) * 100)
              const rightPct = Math.min(100, ((endMs - viewStartMs) / rangeMs) * 100)
              const widthPct = Math.max(0.5, rightPct - leftPct)

              return (
                <div
                  key={task.id}
                  className="absolute top-0.5 h-7 rounded text-white text-xs flex items-center px-2 truncate cursor-default hover:opacity-80 transition-opacity"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: getColor(task.categoryLabel),
                  }}
                  title={`${task.title}\n${new Date(task.startDate).toLocaleDateString("ja-JP")} - ${new Date(task.endDate).toLocaleDateString("ja-JP")}`}
                >
                  {task.title}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
