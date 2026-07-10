import { supabase } from '../lib/supabase'
import type { AiReport } from '../types'

export type AiAnalysisType = 'similar_products' | 'quick_score' | 'angles' | 'decision'
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
    recommendedFor: 'Câu thường: chấm nhanh, angle, quyết định. Ít lỗi nhất.',
  },
  {
    profile: 'cheap',
    label: 'Nhẹ - GPT-5.6 Luna',
    shortLabel: 'Nhẹ',
    recommendedFor: 'Chạy nhiều idea, không cần web search.',
  },
  {
    profile: 'balanced',
    label: 'Cân bằng - GPT-5 mini',
    shortLabel: 'Cân bằng',
    recommendedFor: 'Idea khá quan trọng, cần phân tích tốt hơn bản ổn định.',
  },
  {
    profile: 'strong',
    label: 'Mạnh - GPT-5.6 Terra',
    shortLabel: 'Mạnh',
    recommendedFor: 'Idea quan trọng, cần đánh giá sâu nhưng chưa cần tìm thị trường.',
  },
  {
    profile: 'research',
    label: 'Research - GPT-5.6 Terra + web search',
    shortLabel: 'Research',
    recommendedFor: 'Dùng cho Tìm sản phẩm tương tự. Có thể chậm hơn và tốn hơn.',
  },
]

export const AI_ANALYSIS_TOOLS: Array<{ type: AiAnalysisType; label: string; shortLabel: string; description: string }> = [
  {
    type: 'similar_products',
    label: 'Tìm sản phẩm tương tự',
    shortLabel: 'Tìm tương tự',
    description: 'Tìm/suy luận sản phẩm tương tự, giá, đối thủ và cơ hội khác biệt.',
  },
  {
    type: 'quick_score',
    label: 'Chấm điểm bán hàng',
    shortLabel: 'Chấm nhanh',
    description: 'Chấm điểm khả năng bán, không nịnh, có tổng điểm và red flag.',
  },
  {
    type: 'angles',
    label: 'Gợi ý angle',
    shortLabel: 'Angle',
    description: 'Gợi ý content angle, ads angle, visual và cách làm khác biệt.',
  },
  {
    type: 'decision',
    label: 'Đề xuất quyết định',
    shortLabel: 'Quyết định',
    description: 'Đề xuất Nên test / Cần nghiên cứu thêm / Nên bỏ.',
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
