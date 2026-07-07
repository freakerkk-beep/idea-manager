export interface Niche {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface SubNiche {
  id: string
  niche_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface ProductType {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Assignee {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export const PRIORITY_OPTIONS = ['Chưa đánh giá', 'Cao', 'Trung bình'] as const
export type Priority = (typeof PRIORITY_OPTIONS)[number]

export const STATUS_OPTIONS = [
  'Idea mới',
  'Đang nghiên cứu',
  'Chờ đánh giá',
  'Đã chọn R&D',
  'Đang thiết kế',
  'Đang prototype',
  'Đang tính giá',
  'Đang test',
  'Đã duyệt',
  'Tạm hoãn',
  'Đã loại bỏ',
] as const
export type Status = (typeof STATUS_OPTIONS)[number]

export const EVALUATION_OPTIONS = ['Oke', 'Bình thường', 'Loại bỏ'] as const
export type Evaluation = (typeof EVALUATION_OPTIONS)[number]

export interface Idea {
  id: string
  name: string
  niche_id: string | null
  sub_niche_id: string | null
  product_type_id: string | null
  product_url: string | null
  target_customer: string | null
  priority: Priority
  status: Status
  assignee_id: string | null
  evaluation: Evaluation | null
  notes: string | null
  is_saved: boolean
  saved_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * Bản chụp độc lập của một idea đã lưu.
 * Không có khóa ngoại tới bảng ideas để dữ liệu vẫn còn kể cả khi idea gốc bị xóa.
 */
export interface SavedIdea {
  id: string
  source_idea_id: string | null
  name: string
  niche_id: string | null
  niche_name: string | null
  sub_niche_id: string | null
  sub_niche_name: string | null
  product_type_id: string | null
  product_type_name: string | null
  product_url: string | null
  target_customer: string | null
  priority: Priority
  status: Status
  assignee_id: string | null
  assignee_name: string | null
  evaluation: Evaluation | null
  notes: string | null
  saved_at: string
  created_at: string
  updated_at: string
}

export interface CatalogData {
  niches: Niche[]
  subNiches: SubNiche[]
  productTypes: ProductType[]
  assignees: Assignee[]
}
