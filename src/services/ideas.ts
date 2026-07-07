import { supabase } from '../lib/supabase'
import type { CatalogData, Idea, Priority, SavedIdea } from '../types'

const IDEA_COLUMNS = '*'
const SAVED_IDEA_COLUMNS = '*'


function normalizePriority(value: unknown): Priority {
  if (value === 'Cao' || value === 'Trung bình') return value
  return 'Chưa đánh giá'
}

export async function fetchAllIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select(IDEA_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Idea[]).map((idea) => ({ ...idea, priority: normalizePriority(idea.priority) }))
}

export async function fetchSavedIdeas(): Promise<SavedIdea[]> {
  const { data, error } = await supabase
    .from('saved_ideas')
    .select(SAVED_IDEA_COLUMNS)
    .order('saved_at', { ascending: false })
  if (error) throw error
  return (data as SavedIdea[]).map((idea) => ({ ...idea, priority: normalizePriority(idea.priority) }))
}

export async function createEmptyIdea(nicheId: string | null): Promise<Idea> {
  const { data, error } = await supabase
    .from('ideas')
    .insert({ name: '', niche_id: nicheId })
    .select()
    .single()
  if (error) throw error
  return data as Idea
}

export async function updateIdea(id: string, patch: Partial<Idea>): Promise<Idea> {
  const { data, error } = await supabase.from('ideas').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Idea
}

export async function updateSavedIdea(id: string, patch: Partial<SavedIdea>): Promise<SavedIdea> {
  const { data, error } = await supabase
    .from('saved_ideas')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as SavedIdea
}

/**
 * Lưu một bản chụp độc lập sang bảng saved_ideas.
 * Nếu idea đã từng được lưu, thao tác này cập nhật bản chụp bằng dữ liệu mới nhất.
 */
export async function saveIdeaSnapshots(
  rows: Idea[],
  catalog: CatalogData
): Promise<void> {
  if (rows.length === 0) return

  const now = new Date().toISOString()
  const payload = rows.map((idea) => ({
    source_idea_id: idea.id,
    name: idea.name,
    niche_id: idea.niche_id,
    niche_name: catalog.niches.find((n) => n.id === idea.niche_id)?.name ?? null,
    sub_niche_id: idea.sub_niche_id,
    sub_niche_name: catalog.subNiches.find((s) => s.id === idea.sub_niche_id)?.name ?? null,
    product_type_id: idea.product_type_id,
    product_type_name: catalog.productTypes.find((p) => p.id === idea.product_type_id)?.name ?? null,
    product_url: idea.product_url,
    target_customer: idea.target_customer,
    priority: idea.priority,
    status: idea.status,
    assignee_id: idea.assignee_id,
    assignee_name: catalog.assignees.find((a) => a.id === idea.assignee_id)?.name ?? null,
    evaluation: idea.evaluation,
    notes: idea.notes,
    saved_at: now,
  }))

  const { error } = await supabase
    .from('saved_ideas')
    .upsert(payload, { onConflict: 'source_idea_id' })
  if (error) throw error
}

export async function evaluateIdea(id: string, evaluation: Idea['evaluation']): Promise<Idea> {
  const patch: Partial<Idea> = { evaluation }
  if (evaluation === 'Loại bỏ') {
    patch.status = 'Đã loại bỏ'
    patch.deleted_at = new Date().toISOString()
  }
  return updateIdea(id, patch)
}

export async function restoreIdea(id: string): Promise<Idea> {
  return updateIdea(id, { deleted_at: null, status: 'Idea mới', evaluation: null })
}

export async function softDeleteIdeas(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .update({ status: 'Đã loại bỏ', deleted_at: new Date().toISOString(), evaluation: 'Loại bỏ' })
    .in('id', ids)
  if (error) throw error
}

export async function hardDeleteIdea(id: string): Promise<void> {
  const { error } = await supabase.from('ideas').delete().eq('id', id)
  if (error) throw error
}

export async function hardDeleteIdeas(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('ideas').delete().in('id', ids)
  if (error) throw error
}

export async function deleteSavedIdeas(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('saved_ideas').delete().in('id', ids)
  if (error) throw error
}
