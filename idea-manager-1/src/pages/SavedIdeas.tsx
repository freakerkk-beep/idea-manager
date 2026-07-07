import { useMemo, useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'
import { hardDeleteIdeas, unsaveIdeas, updateIdea } from '../services/ideas'
import { EvaluationBadge, PriorityBadge, StatusBadge } from '../components/Badges'
import { SelectCell, TextAreaCell, TextCell, UrlCell } from '../components/cells'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PRIORITY_OPTIONS, STATUS_OPTIONS, type Idea, type Priority, type Status } from '../types'

function toCsvValue(v: string | null | undefined) {
  const s = (v ?? '').replace(/"/g, '""')
  return `"${s}"`
}

export function SavedIdeas() {
  const { catalog, ideas, refetchIdeas } = useAppData()
  const { showToast } = useToast()

  const saved = useMemo(() => ideas.filter((i) => i.is_saved), [ideas])

  const [search, setSearch] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [subNicheFilter, setSubNicheFilter] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [evalFilter, setEvalFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const filtered = saved.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (nicheFilter && i.niche_id !== nicheFilter) return false
    if (subNicheFilter && i.sub_niche_id !== subNicheFilter) return false
    if (productTypeFilter && i.product_type_id !== productTypeFilter) return false
    if (priorityFilter && i.priority !== priorityFilter) return false
    if (statusFilter && i.status !== statusFilter) return false
    if (assigneeFilter && i.assignee_id !== assigneeFilter) return false
    if (evalFilter && i.evaluation !== evalFilter) return false
    return true
  })

  async function commit(id: string, patch: Partial<Idea>) {
    try {
      await updateIdea(id, patch)
      await refetchIdeas()
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
    else setSelected(new Set(filtered.map((i) => i.id)))
  }

  async function handleUnsaveSelected() {
    try {
      await unsaveIdeas(Array.from(selected))
      await refetchIdeas()
      setSelected(new Set())
      showToast('Đã bỏ lưu idea', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể bỏ lưu idea', 'error')
    }
  }

  async function handleDeleteSelected() {
    setConfirmDeleteOpen(false)
    try {
      await hardDeleteIdeas(Array.from(selected))
      await refetchIdeas()
      setSelected(new Set())
      showToast('Đã xóa idea', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể xóa idea', 'error')
    }
  }

  function handleExportCsv() {
    const headers = [
      'Tên idea', 'Niche chính', 'Niche con', 'Loại sản phẩm', 'Link sản phẩm',
      'Đối tượng khách hàng', 'Mức độ ưu tiên', 'Trạng thái', 'Người phụ trách',
      'Đánh giá', 'Ghi chú', 'Ngày lưu',
    ]
    const rows = filtered.map((i) => [
      i.name,
      catalog.niches.find((n) => n.id === i.niche_id)?.name ?? '',
      catalog.subNiches.find((s) => s.id === i.sub_niche_id)?.name ?? '',
      catalog.productTypes.find((p) => p.id === i.product_type_id)?.name ?? '',
      i.product_url ?? '',
      i.target_customer ?? '',
      i.priority,
      i.status,
      catalog.assignees.find((a) => a.id === i.assignee_id)?.name ?? '',
      i.evaluation ?? '',
      i.notes ?? '',
      i.saved_at ? new Date(i.saved_at).toLocaleDateString('vi-VN') : '',
    ])
    const csv = [headers, ...rows].map((r) => r.map(toCsvValue).join(',')).join('\n')
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
        <p className="text-sm text-slate-500">{filtered.length} idea hiển thị / {saved.length} tổng</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <button
          onClick={handleUnsaveSelected}
          disabled={selected.size === 0}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Bỏ lưu idea ({selected.size})
        </button>
        <button
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={selected.size === 0}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Xóa idea
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
          {catalog.niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <select value={subNicheFilter} onChange={(e) => setSubNicheFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả niche con</option>
          {catalog.subNiches.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả loại sản phẩm</option>
          {catalog.productTypes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả mức ưu tiên</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả người phụ trách</option>
          {catalog.assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={evalFilter} onChange={(e) => setEvalFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả đánh giá</option>
          <option value="Oke">Oke</option>
          <option value="Bình thường">Bình thường</option>
          <option value="Loại bỏ">Loại bỏ</option>
        </select>
      </div>

      <div className="table-scroll flex-1 overflow-auto px-6 py-4">
        <table className="min-w-[1650px] border-separate border-spacing-0 text-sm">
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
              <th className="sticky top-0 min-w-[130px] border-b border-slate-200 bg-slate-100 px-2 py-2">Người phụ trách</th>
              <th className="sticky top-0 min-w-[100px] border-b border-slate-200 bg-slate-100 px-2 py-2">Đánh giá</th>
              <th className="sticky top-0 min-w-[170px] border-b border-slate-200 bg-slate-100 px-2 py-2">Ghi chú</th>
              <th className="sticky top-0 min-w-[110px] border-b border-slate-200 bg-slate-100 px-2 py-2">Ngày lưu</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea) => (
              <tr key={idea.id} className="bg-white odd:bg-slate-50/50 hover:bg-emerald-50/40">
                <td className="border-b border-slate-100 px-2 py-1 align-top">
                  <input type="checkbox" checked={selected.has(idea.id)} onChange={() => toggleSelect(idea.id)} />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <TextCell value={idea.name} required onCommit={(v) => commit(idea.id, { name: v })} />
                </td>
                <td className="border-b border-slate-100 px-2 py-2 align-top text-xs text-slate-600">
                  {catalog.niches.find((n) => n.id === idea.niche_id)?.name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-2 py-2 align-top text-xs text-slate-600">
                  {catalog.subNiches.find((s) => s.id === idea.sub_niche_id)?.name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-2 py-2 align-top text-xs text-slate-600">
                  {catalog.productTypes.find((p) => p.id === idea.product_type_id)?.name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <UrlCell value={idea.product_url ?? ''} onCommit={(v) => commit(idea.id, { product_url: v })} />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <TextCell value={idea.target_customer ?? ''} onCommit={(v) => commit(idea.id, { target_customer: v })} />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell value={idea.priority} options={PRIORITY_OPTIONS} onCommit={(v: Priority) => commit(idea.id, { priority: v })} />
                  <div className="px-2 py-0.5"><PriorityBadge value={idea.priority} /></div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell value={idea.status} options={STATUS_OPTIONS} onCommit={(v: Status) => commit(idea.id, { status: v })} />
                  <div className="px-2 py-0.5"><StatusBadge value={idea.status} /></div>
                </td>
                <td className="border-b border-slate-100 px-2 py-2 align-top text-xs text-slate-600">
                  {catalog.assignees.find((a) => a.id === idea.assignee_id)?.name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-2 py-2 align-top">
                  <EvaluationBadge value={idea.evaluation} />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <TextAreaCell value={idea.notes ?? ''} onCommit={(v) => commit(idea.id, { notes: v })} />
                </td>
                <td className="border-b border-slate-100 px-2 py-2 align-top text-xs text-slate-500">
                  {idea.saved_at ? new Date(idea.saved_at).toLocaleDateString('vi-VN') : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-400">
                  Chưa có idea nào được lưu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Xóa idea đã chọn?"
        message={`Bạn sắp xóa vĩnh viễn ${selected.size} idea. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa vĩnh viễn"
        danger
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  )
}
