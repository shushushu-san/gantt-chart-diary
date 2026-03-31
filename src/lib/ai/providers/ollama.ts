import type {
  AIProvider,
  AIProviderType,
  ClassifyResult,
  PeriodResult,
  SummaryResult,
  OllamaConfig,
} from "../types"
import {
  buildClassifyPrompt,
  buildPeriodPrompt,
  buildSummarizePrompt,
  parseJSONResponse,
} from "../prompts"

export class OllamaProvider implements AIProvider {
  readonly providerType: AIProviderType = "ollama"
  private baseUrl: string
  private model: string

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
    this.model = config.model
  }

  private async generate(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Ollama API error: ${res.status} ${err}`)
    }

    const data = await res.json()
    return data.response as string
  }

  async classify(
    text: string,
    availableCategories: string[]
  ): Promise<ClassifyResult> {
    const prompt = buildClassifyPrompt(text, availableCategories)
    const raw = await this.generate(prompt)
    return parseJSONResponse<ClassifyResult>(raw)
  }

  async extractPeriod(text: string, baseDate: Date): Promise<PeriodResult> {
    const prompt = buildPeriodPrompt(text, baseDate)
    const raw = await this.generate(prompt)
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
    const raw = await this.generate(prompt)
    return parseJSONResponse<SummaryResult>(raw)
  }
}
