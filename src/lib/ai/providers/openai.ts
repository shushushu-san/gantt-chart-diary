import type {
  AIProvider,
  AIProviderType,
  PeriodResult,
  SummaryResult,
  FolderResult,
  OpenAIConfig,
} from "../types"
import {
  buildPeriodPrompt,
  buildSummarizePrompt,
  buildSuggestFolderPrompt,
  parseJSONResponse,
} from "../prompts"

export class OpenAIProvider implements AIProvider {
  readonly providerType: AIProviderType = "openai"
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey
    this.model = config.model
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1"
  }

  private async chat(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, // 分類タスクは低温度で安定した出力を得る
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${res.status} ${err}`)
    }

    const data = await res.json()
    return data.choices[0].message.content as string
  }

  async extractPeriod(text: string, baseDate: Date): Promise<PeriodResult> {
    const prompt = buildPeriodPrompt(text, baseDate)
    const raw = await this.chat(prompt)
    const parsed = parseJSONResponse<{
      startDate: string | null
      endDate: string | null
      isExplicit: boolean
    }>(raw)

    return {
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      isExplicit: parsed.isExplicit,
    }
  }

  async summarize(text: string): Promise<SummaryResult> {
    const prompt = buildSummarizePrompt(text)
    const raw = await this.chat(prompt)
    return parseJSONResponse<SummaryResult>(raw)
  }

  async suggestFolder(text: string, projectName: string): Promise<FolderResult> {
    const prompt = buildSuggestFolderPrompt(text, projectName)
    const raw = await this.chat(prompt)
    const parsed = parseJSONResponse<FolderResult>(raw)
    // フォルダ名を安全な文字のみに限定
    parsed.folder = parsed.folder.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 20).toLowerCase()
    return parsed
  }
}
