import { supabase } from '../lib/supabase'
import type { AiReport } from '../types'

export type AiAnalysisType = 'amazon_listing'
export type AiModelProfile = 'stable' | 'cheap' | 'balanced' | 'strong' | 'research'

export const AI_MODEL_PROFILES: Array<{
  profile: AiModelProfile
  label: string
  shortLabel: string
  recommendedFor: string
}> = [
  {
    profile: 'stable',
    label: 'Ổn định - GPT-4.1 mini',
    shortLabel: 'Ổn định',
    recommendedFor: 'Dùng mặc định để viết listing nhanh, ít lỗi nhất.',
  },
  {
    profile: 'cheap',
    label: 'Nhẹ - GPT-4.1 mini',
    shortLabel: 'Nhẹ',
    recommendedFor: 'Dùng khi muốn viết nhiều listing liên tục.',
  },
  {
    profile: 'balanced',
    label: 'Cân bằng',
    shortLabel: 'Cân bằng',
    recommendedFor: 'Dùng cho sản phẩm khá quan trọng, cần copy tốt hơn.',
  },
  {
    profile: 'strong',
    label: 'Mạnh',
    shortLabel: 'Mạnh',
    recommendedFor: 'Dùng cho sản phẩm đã shortlist, cần listing kỹ hơn.',
  },
  {
    profile: 'research',
    label: 'Research / có thể đọc web',
    shortLabel: 'Research',
    recommendedFor: 'Chỉ dùng khi có link sản phẩm và muốn AI tham chiếu kỹ hơn. Có thể chậm hơn.',
  },
]

export const AI_ANALYSIS_TOOLS: Array<{ type: AiAnalysisType; label: string; shortLabel: string; description: string }> = [
  {
    type: 'amazon_listing',
    label: 'Viết listing Amazon',
    shortLabel: 'Amazon listing',
    description: 'Tạo title, bullet points, description, search terms và checklist ảnh cho Amazon US.',
  },
]

export interface AnalyzeIdeaInput {
  sourceType: 'idea' | 'saved_idea'
  idea: Record<string, unknown>
  analysisType?: AiAnalysisType
  modelProfile?: AiModelProfile
  modelProfileLabel?: string
}

export interface AnalyzeIdeaResult {
  report: string
  reportObject?: unknown
  score: number | null
  model: string | null
  usedWebSearch?: boolean
  usedImageInput?: boolean
  productPageTextAvailable?: boolean
  warning?: string
  analysisType?: AiAnalysisType
  modelProfile?: AiModelProfile
  modelProfileLabel?: string
}

export function parseAiReport(report: string | null | undefined): any | null {
  if (!report || typeof report !== 'string') return null
  try {
    const parsed = JSON.parse(report)
    if (parsed && typeof parsed === 'object' && parsed.report_type) return parsed
  } catch {
    return null
  }
  return null
}

export function getAiReportType(report: AiReport | string | null | undefined): AiAnalysisType | 'legacy' | null {
  const text = typeof report === 'string' ? report : report?.report_markdown
  const parsed = parseAiReport(text)
  if (parsed?.report_type) return parsed.report_type as AiAnalysisType
  if (text) return 'legacy'
  return null
}

export async function fetchAiReports(): Promise<AiReport[]> {
  const { data, error } = await supabase
    .from('idea_ai_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AiReport[]
}

export async function createAiReport(payload: Omit<AiReport, 'id' | 'created_at'>): Promise<AiReport> {
  const { data, error } = await supabase
    .from('idea_ai_reports')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as AiReport
}

function withTimeout(ms: number) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), ms)
  return { controller, timeout }
}

function shouldRetry(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return message.includes('timeout') || message.includes('rate') || message.includes('429') || message.includes('fetch') || message.includes('network')
}

async function postAnalyze(input: AnalyzeIdeaInput): Promise<AnalyzeIdeaResult> {
  const { controller, timeout } = withTimeout(65000)
  try {
    const response = await fetch('/.netlify/functions/analyze-idea', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error || 'Không thể gọi AI analysis.')
    }

    return data as AnalyzeIdeaResult
  } catch (error) {
    if ((error as any)?.name === 'AbortError') throw new Error('AI phân tích quá lâu, vui lòng thử lại.')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function analyzeIdeaWithOpenAI(input: AnalyzeIdeaInput): Promise<AnalyzeIdeaResult> {
  try {
    return await postAnalyze(input)
  } catch (error) {
    if (!shouldRetry(error)) throw error
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
    return postAnalyze(input)
  }
}
