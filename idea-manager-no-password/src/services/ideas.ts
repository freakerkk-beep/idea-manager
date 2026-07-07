import { supabase } from '../lib/supabase'
import type { Idea } from '../types'

const IDEA_COLUMNS = '*'

export async function fetchAllIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select(IDEA_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Idea[]
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

export async function saveIdeas(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .update({ is_saved: true, saved_at: new Date().toISOString() })
    .in('id', ids)
  if (error) throw error
}

export async function unsaveIdeas(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .update({ is_saved: false, saved_at: null })
    .in('id', ids)
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
  const { error } = await supabase.from('ideas').delete().in('id', ids)
  if (error) throw error
}
