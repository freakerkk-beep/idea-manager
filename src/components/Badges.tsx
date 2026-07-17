import type { Evaluation, Priority, Status } from '../types'

const priorityStyles: Record<Priority, string> = {
  'Chưa đánh giá': 'bg-slate-100 text-slate-600',
  'Trung bình': 'bg-amber-100 text-amber-700',
  Cao: 'bg-emerald-100 text-emerald-700',
}

export function PriorityBadge({ value }: { value: Priority }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[value]}`}>
      {value}
    </span>
  )
}

const statusStyles: Record<Status, string> = {
  'Idea mới': 'bg-slate-100 text-slate-600',
  'Đang nghiên cứu': 'bg-indigo-100 text-indigo-700',
  'Chờ đánh giá': 'bg-amber-100 text-amber-700',
  'Đã chọn R&D': 'bg-cyan-100 text-cyan-700',
  'Đang thiết kế': 'bg-violet-100 text-violet-700',
  'Đang prototype': 'bg-fuchsia-100 text-fuchsia-700',
  'Đang tính giá': 'bg-orange-100 text-orange-700',
  'Đang test': 'bg-yellow-100 text-yellow-700',
  'Đã duyệt': 'bg-emerald-100 text-emerald-700',
  'Tạm hoãn': 'bg-stone-200 text-stone-700',
  'Đã loại bỏ': 'bg-red-100 text-red-700',
}

export function StatusBadge({ value }: { value: Status }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[value]}`}>
      {value}
    </span>
  )
}

const evalStyles: Record<Evaluation, string> = {
  Oke: 'bg-emerald-100 text-emerald-700',
  'Bình thường': 'bg-amber-100 text-amber-700',
  'Loại bỏ': 'bg-red-100 text-red-700',
}

export function EvaluationBadge({ value }: { value: Evaluation | null }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${evalStyles[value]}`}>
      {value}
    </span>
  )
}
