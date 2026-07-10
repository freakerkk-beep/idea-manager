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
  const response = await fetch('/.netlify/functions/analyze-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Không thể gọi AI analysis.')
  }

  return data as AnalyzeIdeaResult
}
