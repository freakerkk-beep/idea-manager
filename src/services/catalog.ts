import { supabase } from '../lib/supabase'
import {
  DEFAULT_STATUS_OPTIONS,
  type Assignee,
  type CatalogData,
  type Niche,
  type ProductType,
  type StatusOption,
  type SubNiche,
} from '../types'

function fallbackStatusOptions(): StatusOption[] {
  return DEFAULT_STATUS_OPTIONS.map((name, index) => ({
    id: `fallback-${index}`,
    name,
    is_active: true,
    sort_order: index,
    created_at: '',
  }))
}

export async function fetchCatalog(): Promise<CatalogData> {
  const [niches, subNiches, productTypes, assignees, statuses] = await Promise.all([
    supabase.from('niches').select('*').order('name'),
    supabase.from('sub_niches').select('*').order('name'),
    supabase.from('product_types').select('*').order('name'),
    supabase.from('assignees').select('*').order('name'),
    supabase.from('status_options').select('*').order('sort_order').order('name'),
  ])

  if (niches.error) throw niches.error
  if (subNiches.error) throw subNiches.error
  if (productTypes.error) throw productTypes.error
  if (assignees.error) throw assignees.error

  let statusOptions: StatusOption[]
  if (statuses.error) {
    // Giữ website hoạt động trong lúc người dùng chưa chạy file migration mới.
    if (statuses.error.code === 'PGRST205' || statuses.error.code === '42P01') {
      statusOptions = fallbackStatusOptions()
    } else {
      throw statuses.error
    }
  } else {
    statusOptions = statuses.data as StatusOption[]
  }

  return {
    niches: niches.data as Niche[],
    subNiches: subNiches.data as SubNiche[],
    productTypes: productTypes.data as ProductType[],
    assignees: assignees.data as Assignee[],
    statusOptions,
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
    throw new Error('Không thể xóa niche con vì đã có idea sử dụng. Hãy ẩn niche thay vì xóa.')
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

export async function deleteAssignee(id: string) {
  const { error: unlinkError } = await supabase
    .from('ideas')
    .update({ assignee_id: null })
    .eq('assignee_id', id)
  if (unlinkError) throw unlinkError

  const { error } = await supabase.from('assignees').delete().eq('id', id)
  if (error) throw error
}

// ---------- Status options ----------
const LOCKED_STATUS_NAMES = new Set(['Idea mới', 'Đã loại bỏ'])

export async function createStatusOption(name: string) {
  const { data, error } = await supabase
    .from('status_options')
    .insert({ name, sort_order: 1000 })
    .select()
    .single()
  if (error) throw error
  return data as StatusOption
}

export async function updateStatusOption(id: string, patch: Partial<StatusOption>) {
  const { data: current, error: currentError } = await supabase
    .from('status_options')
    .select('*')
    .eq('id', id)
    .single()
  if (currentError) throw currentError

  const row = current as StatusOption
  if (LOCKED_STATUS_NAMES.has(row.name) && (patch.name || patch.is_active === false)) {
    throw new Error(`Trạng thái “${row.name}” là trạng thái hệ thống và không thể đổi tên hoặc ẩn.`)
  }

  if (patch.name && patch.name !== row.name) {
    const { error } = await supabase.rpc('rename_status_option', {
      p_id: id,
      p_new_name: patch.name,
    })
    if (error) throw error
  }

  const remainingPatch = { ...patch }
  delete remainingPatch.name
  if (Object.keys(remainingPatch).length > 0) {
    const { error } = await supabase.from('status_options').update(remainingPatch).eq('id', id)
    if (error) throw error
  }
}

export async function deleteStatusOption(id: string) {
  const { data: current, error: currentError } = await supabase
    .from('status_options')
    .select('*')
    .eq('id', id)
    .single()
  if (currentError) throw currentError

  const row = current as StatusOption
  if (LOCKED_STATUS_NAMES.has(row.name)) {
    throw new Error(`Trạng thái “${row.name}” là trạng thái hệ thống và không thể xóa.`)
  }

  const [ideaUsage, savedUsage] = await Promise.all([
    supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('status', row.name),
    supabase.from('saved_ideas').select('id', { count: 'exact', head: true }).eq('status', row.name),
  ])
  if (ideaUsage.error) throw ideaUsage.error
  if (savedUsage.error) throw savedUsage.error
  if ((ideaUsage.count ?? 0) > 0 || (savedUsage.count ?? 0) > 0) {
    throw new Error('Không thể xóa trạng thái vì đang có idea sử dụng. Hãy ẩn trạng thái thay vì xóa.')
  }

  const { error } = await supabase.from('status_options').delete().eq('id', id)
  if (error) throw error
}
