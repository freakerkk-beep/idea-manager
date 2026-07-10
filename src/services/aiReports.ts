import { supabase } from '../lib/supabase'
import type { AiReport } from '../types'

export interface AnalyzeIdeaInput {
  sourceType: 'idea' | 'saved_idea'
  idea: Record<string, unknown>
}

export interface AnalyzeIdeaResult {
  report: string
  score: number | null
  model: string | null
  usedWebSearch?: boolean
  productPageTextAvailable?: boolean
  warning?: string
}

const ANALYZE_TIMEOUT_MS = 35000

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

export async function analyzeIdeaWithOpenAI(input: AnalyzeIdeaInput): Promise<AnalyzeIdeaResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS)

  try {
    const response = await fetch('/.netlify/functions/analyze-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error || 'Không thể gọi AI analysis.')
    }

    return data as AnalyzeIdeaResult
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI phản hồi quá lâu. Vui lòng thử lại.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
