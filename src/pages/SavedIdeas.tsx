import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'
import { deleteSavedIdeas, updateSavedIdea } from '../services/ideas'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { SelectCell, TextAreaCell, TextCell, UrlCell } from '../components/cells'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  type Priority,
  type SavedIdea,
  type Status,
} from '../types'

function toCsvValue(v: string | null | undefined) {
  const s = (v ?? '').replace(/"/g, '""')
  return `"${s}"`
}

function rowPriorityClass(priority: Priority) {
  if (priority === 'Cao') return 'priority-row-high'
  if (priority === 'Trung bình') return 'priority-row-medium'
  return ''
}

function toLocalDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function SavedIdeas() {
  const { catalog, savedIdeas, refetchSavedIdeas } = useAppData()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [subNicheFilter, setSubNicheFilter] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const filtered = savedIdeas.filter((idea) => {
    if (search && !idea.name.toLowerCase().includes(search.toLowerCase())) return false
    if (nicheFilter && idea.niche_id !== nicheFilter) return false
    if (subNicheFilter && idea.sub_niche_id !== subNicheFilter) return false
    if (productTypeFilter && idea.product_type_id !== productTypeFilter) return false
    if (priorityFilter && idea.priority !== priorityFilter) return false
    if (statusFilter && idea.status !== statusFilter) return false
    if (assigneeFilter && idea.assignee_id !== assigneeFilter) return false
    const savedDate = toLocalDateKey(idea.saved_at)
    if (dateFrom && savedDate < dateFrom) return false
    if (dateTo && savedDate > dateTo) return false
    return true
  })

  function filterToday() {
    const today = toLocalDateKey(new Date())
    setDateFrom(today)
    setDateTo(today)
  }

  function clearDateFilter() {
    setDateFrom('')
    setDateTo('')
  }

  async function commit(id: string, patch: Partial<SavedIdea>) {
    try {
      await updateSavedIdea(id, patch)
      await refetchSavedIdeas()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Có lỗi khi lưu thay đổi', 'error')
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((idea) => idea.id)))
  }

  async function handleDeleteSelected() {
    setConfirmDeleteOpen(false)
    try {
      await deleteSavedIdeas(Array.from(selected))
      await refetchSavedIdeas()
      setSelected(new Set())
      showToast('Đã xóa bản lưu vĩnh viễn', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể xóa idea đã lưu', 'error')
    }
  }

  function handleExportCsv() {
    const headers = [
      'Tên idea',
      'Niche chính',
      'Niche con',
      'Loại sản phẩm',
      'Link sản phẩm',
      'Đối tượng khách hàng',
      'Mức độ ưu tiên',
      'Trạng thái',
      'Owner',
      'Ghi chú',
      'Ngày lưu',
    ]
    const rows = filtered.map((idea) => [
      idea.name,
      idea.niche_name ?? '',
      idea.sub_niche_name ?? '',
      idea.product_type_name ?? '',
      idea.product_url ?? '',
      idea.target_customer ?? '',
      idea.priority,
      idea.status,
      idea.assignee_name ?? '',
      idea.notes ?? '',
      new Date(idea.saved_at).toLocaleDateString('vi-VN'),
    ])
    const csv = [headers, ...rows].map((row) => row.map(toCsvValue).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `idea-da-luu-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Đã xuất file CSV', 'success')
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Idea đã lưu</h1>
        <p className="text-sm text-slate-500">
          {filtered.length} idea hiển thị / {savedIdeas.length} tổng
          {(dateFrom || dateTo) && ' · Đang lọc theo ngày lưu'}
          {' · '}Bản lưu độc lập, không bị mất khi dọn idea ở niche.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <button
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={selected.size === 0}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Xóa idea đã lưu ({selected.size})
        </button>
        <button
          onClick={handleExportCsv}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Xuất CSV
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm idea theo tên..."
          className="ml-auto w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-6 py-2">
        <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả niche</option>
          {catalog.niches.map((niche) => <option key={niche.id} value={niche.id}>{niche.name}</option>)}
        </select>
        <select value={subNicheFilter} onChange={(e) => setSubNicheFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả niche con</option>
          {catalog.subNiches.map((subNiche) => <option key={subNiche.id} value={subNiche.id}>{subNiche.name}</option>)}
        </select>
        <select value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả loại sản phẩm</option>
          {catalog.productTypes.map((productType) => <option key={productType.id} value={productType.id}>{productType.name}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả mức ưu tiên</option>
          {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả Owner</option>
          {catalog.assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
        </select>

        <div className="ml-1 flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-1">
          <span className="whitespace-nowrap text-xs font-medium text-slate-600">Ngày lưu:</span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Từ ngày lưu"
            className="w-[125px] bg-transparent text-xs text-slate-700 outline-none"
          />
          <span className="text-xs text-slate-400">đến</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Đến ngày lưu"
            className="w-[125px] bg-transparent text-xs text-slate-700 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={filterToday}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Hôm nay
        </button>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={clearDateFilter}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            Xóa lọc ngày
          </button>
        )}
      </div>

      <div className="table-scroll flex-1 overflow-auto px-6 py-4">
        <table className="idea-grid-table min-w-[1500px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="sticky top-0 w-10 border-b border-slate-200 bg-slate-100 px-2 py-2">
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} />
              </th>
              <th className="sticky top-0 min-w-[200px] border-b border-slate-200 bg-slate-100 px-2 py-2">Tên idea</th>
              <th className="sticky top-0 min-w-[110px] border-b border-slate-200 bg-slate-100 px-2 py-2">Niche chính</th>
              <th className="sticky top-0 min-w-[130px] border-b border-slate-200 bg-slate-100 px-2 py-2">Niche con</th>
              <th className="sticky top-0 min-w-[130px] border-b border-slate-200 bg-slate-100 px-2 py-2">Loại sản phẩm</th>
              <th className="sticky top-0 min-w-[170px] border-b border-slate-200 bg-slate-100 px-2 py-2">Link sản phẩm</th>
              <th className="sticky top-0 min-w-[140px] border-b border-slate-200 bg-slate-100 px-2 py-2">Đối tượng KH</th>
              <th className="sticky top-0 min-w-[120px] border-b border-slate-200 bg-slate-100 px-2 py-2">Ưu tiên</th>
              <th className="sticky top-0 min-w-[140px] border-b border-slate-200 bg-slate-100 px-2 py-2">Trạng thái</th>
              <th className="sticky top-0 min-w-[130px] border-b border-slate-200 bg-slate-100 px-2 py-2">Owner</th>
              <th className="sticky top-0 min-w-[170px] border-b border-slate-200 bg-slate-100 px-2 py-2">Ghi chú</th>
              <th className="sticky top-0 min-w-[110px] border-b border-slate-200 bg-slate-100 px-2 py-2">Ngày lưu</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea) => (
              <tr key={idea.id} className={rowPriorityClass(idea.priority)}>
                <td className="px-2 py-1 align-top">
                  <input type="checkbox" checked={selected.has(idea.id)} onChange={() => toggleSelect(idea.id)} />
                </td>
                <td className="px-1 py-1 align-top">
                  <TextCell value={idea.name} required onCommit={(value) => commit(idea.id, { name: value })} />
                </td>
                <td className="px-2 py-2 align-top text-xs text-slate-600">{idea.niche_name || '—'}</td>
                <td className="px-2 py-2 align-top text-xs text-slate-600">{idea.sub_niche_name || '—'}</td>
                <td className="px-2 py-2 align-top text-xs text-slate-600">{idea.product_type_name || '—'}</td>
                <td className="px-1 py-1 align-top">
                  <UrlCell value={idea.product_url ?? ''} onCommit={(value) => commit(idea.id, { product_url: value })} />
                </td>
                <td className="px-1 py-1 align-top">
                  <TextCell value={idea.target_customer ?? ''} onCommit={(value) => commit(idea.id, { target_customer: value })} />
                </td>
                <td className="px-1 py-1 align-top">
                  <SelectCell value={idea.priority} options={PRIORITY_OPTIONS} onCommit={(value: Priority) => commit(idea.id, { priority: value })} />
                  <div className="px-2 py-0.5"><PriorityBadge value={idea.priority} /></div>
                </td>
                <td className="px-1 py-1 align-top">
                  <SelectCell value={idea.status} options={STATUS_OPTIONS} onCommit={(value: Status) => commit(idea.id, { status: value })} />
                  <div className="px-2 py-0.5"><StatusBadge value={idea.status} /></div>
                </td>
                <td className="px-2 py-2 align-top text-xs text-slate-600">{idea.assignee_name || '—'}</td>
                <td className="px-1 py-1 align-top">
                  <TextAreaCell value={idea.notes ?? ''} onCommit={(value) => commit(idea.id, { notes: value })} />
                </td>
                <td className="px-2 py-2 align-top text-xs text-slate-500">
                  {new Date(idea.saved_at).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-sm text-slate-400">Chưa có idea nào được lưu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Xóa idea đã lưu?"
        message={`Bạn sắp xóa vĩnh viễn ${selected.size} bản lưu. Hành động này không ảnh hưởng tới idea gốc trong niche nhưng không thể hoàn tác.`}
        confirmLabel="Xóa bản lưu"
        danger
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  )
}
