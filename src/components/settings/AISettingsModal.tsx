"use client"

import { useEffect, useState } from "react"

type Provider = "none" | "openai" | "ollama"

type AISettings = {
  provider: Provider
  openaiApiKeySet: boolean
  openaiModel: string
  ollamaBaseUrl: string
  ollamaModel: string
}

type OllamaModel = {
  name: string
  sizeMB: number
}

type Props = {
  onClose: () => void
}

export function AISettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState<AISettings>({
    provider: "none",
    openaiApiKeySet: false,
    openaiModel: "gpt-4o",
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "",
  })
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)

  async function fetchOllamaModels(baseUrl: string) {
    setFetchingModels(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/settings/ai/models?baseUrl=${encodeURIComponent(baseUrl)}`)
      const data = await res.json() as { models?: OllamaModel[]; error?: string }
      if (!res.ok || data.error) {
        setMessage({ type: "error", text: data.error ?? "モデル取得に失敗しました" })
        setOllamaModels([])
      } else {
        const models = data.models ?? []
        setOllamaModels(models)
        if (models.length > 0 && !models.find((m) => m.name === settings.ollamaModel)) {
          setSettings((s) => ({ ...s, ollamaModel: models[0].name }))
        }
        setMessage({ type: "success", text: `${models.length}個のモデルを取得しました` })
      }
    } catch {
      setMessage({ type: "error", text: "Ollamaに接続できません" })
    } finally {
      setFetchingModels(false)
    }
  }

  // 現在の設定を取得
  useEffect(() => {
    fetch("/api/settings/ai")
      .then((r) => r.json())
      .then((data: AISettings) => {
        setSettings(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const body: Record<string, string> = {
        provider: settings.provider,
        openaiModel: settings.openaiModel,
        ollamaBaseUrl: settings.ollamaBaseUrl,
        ollamaModel: settings.ollamaModel,
      }
      if (openaiApiKey) body.openaiApiKey = openaiApiKey

      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("保存に失敗しました")
      const updated = await res.json() as AISettings
      setSettings(updated)
      setOpenaiApiKey("")
      setMessage({ type: "success", text: "設定を保存しました" })
    } catch {
      setMessage({ type: "error", text: "保存に失敗しました" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">AI設定</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="閉じる">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-4">読み込み中...</p>
          ) : (
            <>
              {/* プロバイダー選択 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">AIプロバイダー</label>
                <div className="space-y-2">
                  {([
                    { value: "none", label: "使用しない", desc: "AI解析を行わず手動で入力" },
                    { value: "openai", label: "Cloud API (OpenAI)", desc: "GPT-4oなどを使用（APIキー必要）" },
                    { value: "ollama", label: "ローカルLLM (Ollama)", desc: "プライベート・無料（要별도設定）" },
                  ] as { value: Provider; label: string; desc: string }[]).map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.provider === value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="provider"
                        value={value}
                        checked={settings.provider === value}
                        onChange={() => setSettings((s) => ({ ...s, provider: value }))}
                        className="mt-0.5 accent-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* OpenAI 設定 */}
              {settings.provider === "openai" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      APIキー
                      {settings.openaiApiKeySet && (
                        <span className="ml-2 text-green-600 font-normal">（設定済み）</span>
                      )}
                    </label>
                    <input
                      type="password"
                      placeholder={settings.openaiApiKeySet ? "変更する場合のみ入力" : "sk-..."}
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">モデル</label>
                    <select
                      value={settings.openaiModel}
                      onChange={(e) => setSettings((s) => ({ ...s, openaiModel: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Ollama 設定 */}
              {settings.provider === "ollama" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ollama URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.ollamaBaseUrl}
                        onChange={(e) => setSettings((s) => ({ ...s, ollamaBaseUrl: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => fetchOllamaModels(settings.ollamaBaseUrl)}
                        disabled={fetchingModels}
                        className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md disabled:opacity-50 whitespace-nowrap transition-colors"
                      >
                        {fetchingModels ? "取得中..." : "モデル取得"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">「モデル取得」でOllamaのインストール済みモデルを取得</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">モデル</label>
                    {ollamaModels.length > 0 ? (
                      <select
                        value={settings.ollamaModel}
                        onChange={(e) => setSettings((s) => ({ ...s, ollamaModel: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {ollamaModels.map((m) => (
                          <option key={m.name} value={m.name}>
                            {m.name}（{m.sizeMB >= 1024 ? `${(m.sizeMB / 1024).toFixed(1)}GB` : `${m.sizeMB}MB`}）
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={settings.ollamaModel}
                        onChange={(e) => setSettings((s) => ({ ...s, ollamaModel: e.target.value }))}
                        placeholder="「モデル取得」を押すか直接入力"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                    {settings.ollamaModel && (
                      <p className="text-xs text-gray-500 mt-1">選択中: <span className="font-mono text-indigo-600">{settings.ollamaModel}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* メッセージ */}
              {message && (
                <p className={`text-xs px-3 py-2 rounded-md ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message.text}
                </p>
              )}

              {/* 保存ボタン */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
