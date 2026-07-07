import { supabase } from '../lib/supabase'
import type { Assignee, CatalogData, Niche, ProductType, SubNiche } from '../types'

export async function fetchCatalog(): Promise<CatalogData> {
  const [niches, subNiches, productTypes, assignees] = await Promise.all([
    supabase.from('niches').select('*').order('name'),
    supabase.from('sub_niches').select('*').order('name'),
    supabase.from('product_types').select('*').order('name'),
    supabase.from('assignees').select('*').order('name'),
  ])

  if (niches.error) throw niches.error
  if (subNiches.error) throw subNiches.error
  if (productTypes.error) throw productTypes.error
  if (assignees.error) throw assignees.error

  return {
    niches: niches.data as Niche[],
    subNiches: subNiches.data as SubNiche[],
    productTypes: productTypes.data as ProductType[],
    assignees: assignees.data as Assignee[],
  }
}

// ---------- Niches ----------
export async function createNiche(name: string) {
  const { data, error } = await supabase.from('niches').insert({ name }).select().single()
  if (error) throw error
  return data as Niche
}
export async function updateNiche(id: string, patch: Partial<Niche>) {
  const { error } = await supabase.from('niches').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteNiche(id: string) {
  const { count } = await supabase
    .from('ideas')
    .select('id', { count: 'exact', head: true })
    .eq('niche_id', id)
  if (count && count > 0) {
    throw new Error('Không thể xóa niche vì đã có idea sử dụng. Hãy ẩn niche thay vì xóa.')
  }
  const { error } = await supabase.from('niches').delete().eq('id', id)
  if (error) throw error
}

// ---------- Sub niches ----------
export async function createSubNiche(nicheId: string, name: string) {
  const { data, error } = await supabase
    .from('sub_niches')
    .insert({ niche_id: nicheId, name })
    .select()
    .single()
  if (error) throw error
  return data as SubNiche
}
export async function updateSubNiche(id: string, patch: Partial<SubNiche>) {
  const { error } = await supabase.from('sub_niches').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteSubNiche(id: string) {
  const { count } = await supabase
    .from('ideas')
    .select('id', { count: 'exact', head: true })
    .eq('sub_niche_id', id)
  if (count && count > 0) {
    throw new Error('Không thể xóa niche con vì đã có idea sử dụng. Hãy ẩn thay vì xóa.')
  }
  const { error } = await supabase.from('sub_niches').delete().eq('id', id)
  if (error) throw error
}

// ---------- Product types ----------
export async function createProductType(name: string) {
  const { data, error } = await supabase.from('product_types').insert({ name }).select().single()
  if (error) throw error
  return data as ProductType
}
export async function updateProductType(id: string, patch: Partial<ProductType>) {
  const { error } = await supabase.from('product_types').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteProductType(id: string) {
  const { count } = await supabase
    .from('ideas')
    .select('id', { count: 'exact', head: true })
    .eq('product_type_id', id)
  if (count && count > 0) {
    throw new Error('Không thể xóa loại sản phẩm vì đã có idea sử dụng. Hãy ẩn thay vì xóa.')
  }
  const { error } = await supabase.from('product_types').delete().eq('id', id)
  if (error) throw error
}

// ---------- Assignees ----------
export async function createAssignee(name: string) {
  const { data, error } = await supabase.from('assignees').insert({ name }).select().single()
  if (error) throw error
  return data as Assignee
}
export async function updateAssignee(id: string, patch: Partial<Assignee>) {
  const { error } = await supabase.from('assignees').update(patch).eq('id', id)
  if (error) throw error
}
