import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'
import {
  createEmptyIdea,
  evaluateIdea,
  hardDeleteIdeas,
  saveIdeas,
  updateIdea,
} from '../services/ideas'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { SelectCell, TextAreaCell, TextCell, UrlCell } from '../components/cells'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PRIORITY_OPTIONS, STATUS_OPTIONS, type Idea, type Priority, type Status } from '../types'

export function NichePage() {
  const { nicheId } = useParams<{ nicheId: string }>()
  const { catalog, ideas, refetchIdeas } = useAppData()
  const { showToast } = useToast()

  const niche = catalog.niches.find((n) => n.id === nicheId)
  const subNichesForNiche = catalog.subNiches.filter((s) => s.niche_id === nicheId && s.is_active)

  const nicheIdeas = useMemo(
    () => ideas.filter((i) => i.niche_id === nicheId && i.status !== 'Đã loại bỏ'),
    [ideas, nicheId]
  )

  const [search, setSearch] = useState('')
  const [subNicheFilter, setSubNicheFilter] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [evalFilter, setEvalFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const filtered = nicheIdeas.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (subNicheFilter && i.sub_niche_id !== subNicheFilter) return false
    if (productTypeFilter && i.product_type_id !== productTypeFilter) return false
    if (priorityFilter && i.priority !== priorityFilter) return false
    if (statusFilter && i.status !== statusFilter) return false
    if (assigneeFilter && i.assignee_id !== assigneeFilter) return false
    if (evalFilter && i.evaluation !== evalFilter) return false
    return true
  })

  async function handleAddIdea() {
    try {
      await createEmptyIdea(nicheId ?? null)
      await refetchIdeas()
      showToast('Đã thêm idea mới', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể thêm idea', 'error')
    }
  }

  async function commit(id: string, patch: Partial<Idea>) {
    try {
      await updateIdea(id, patch)
      await refetchIdeas()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Có lỗi khi lưu thay đổi', 'error')
    }
  }

  async function handleSaveOne(idea: Idea) {
    if (!idea.name.trim()) {
      showToast('Vui lòng nhập tên idea trước khi lưu', 'error')
      return
    }
    try {
      await saveIdeas([idea.id])
      await refetchIdeas()
      showToast('Đã lưu idea', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể lưu idea', 'error')
    }
  }

  async function handleSaveSelected() {
    const rows = filtered.filter((i) => selected.has(i.id))
    const missingName = rows.some((r) => !r.name.trim())
    if (missingName) {
      showToast('Một số idea chưa có tên nên không thể lưu', 'error')
      return
    }
    try {
      await saveIdeas(rows.map((r) => r.id))
      await refetchIdeas()
      setSelected(new Set())
      showToast(`Đã lưu ${rows.length} idea`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể lưu các idea đã chọn', 'error')
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

  async function handleEvaluate(idea: Idea, value: NonNullable<Idea['evaluation']>) {
    try {
      await evaluateIdea(idea.id, value)
      await refetchIdeas()
      showToast(value === 'Loại bỏ' ? 'Đã chuyển idea vào mục Đã loại bỏ' : `Đã đánh giá: ${value}`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể đánh giá idea', 'error')
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

  if (!niche) {
    return <div className="p-6 text-sm text-slate-500">Không tìm thấy niche này.</div>
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">{niche.name} – Idea Brainstorm</h1>
        <p className="text-sm text-slate-500">{filtered.length} idea hiển thị / {nicheIdeas.length} tổng</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <button
          onClick={handleAddIdea}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          + Thêm idea
        </button>
        <button
          onClick={handleSaveSelected}
          disabled={selected.size === 0}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Lưu các idea đã chọn ({selected.size})
        </button>
        <button
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={selected.size === 0}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Xóa các idea đã chọn
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm idea theo tên..."
          className="ml-auto w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-6 py-2">
        <select value={subNicheFilter} onChange={(e) => setSubNicheFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả niche con</option>
          {subNichesForNiche.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả loại sản phẩm</option>
          {catalog.productTypes.filter((p) => p.is_active).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
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
          {catalog.assignees.filter((a) => a.is_active).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select value={evalFilter} onChange={(e) => setEvalFilter(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          <option value="">Tất cả đánh giá</option>
          <option value="Oke">Oke</option>
          <option value="Bình thường">Bình thường</option>
          <option value="Loại bỏ">Loại bỏ</option>
        </select>
      </div>

      <div className="table-scroll flex-1 overflow-auto px-6 py-4">
        <table className="min-w-[1700px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="sticky top-0 w-10 border-b border-slate-200 bg-slate-100 px-2 py-2">
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} />
              </th>
              <th className="sticky top-0 min-w-[220px] border-b border-slate-200 bg-slate-100 px-2 py-2">Tên idea</th>
              <th className="sticky top-0 min-w-[130px] border-b border-slate-200 bg-slate-100 px-2 py-2">Niche chính</th>
              <th className="sticky top-0 min-w-[150px] border-b border-slate-200 bg-slate-100 px-2 py-2">Niche con</th>
              <th className="sticky top-0 min-w-[140px] border-b border-slate-200 bg-slate-100 px-2 py-2">Loại sản phẩm</th>
              <th className="sticky top-0 min-w-[180px] border-b border-slate-200 bg-slate-100 px-2 py-2">Link sản phẩm</th>
              <th className="sticky top-0 min-w-[150px] border-b border-slate-200 bg-slate-100 px-2 py-2">Đối tượng khách hàng</th>
              <th className="sticky top-0 min-w-[130px] border-b border-slate-200 bg-slate-100 px-2 py-2">Mức độ ưu tiên</th>
              <th className="sticky top-0 min-w-[150px] border-b border-slate-200 bg-slate-100 px-2 py-2">Trạng thái xử lý</th>
              <th className="sticky top-0 min-w-[140px] border-b border-slate-200 bg-slate-100 px-2 py-2">Người phụ trách</th>
              <th className="sticky top-0 min-w-[220px] border-b border-slate-200 bg-slate-100 px-2 py-2">Đánh giá</th>
              <th className="sticky top-0 min-w-[180px] border-b border-slate-200 bg-slate-100 px-2 py-2">Ghi chú</th>
              <th className="sticky top-0 min-w-[100px] border-b border-slate-200 bg-slate-100 px-2 py-2">Lưu idea</th>
              <th className="sticky top-0 min-w-[70px] border-b border-slate-200 bg-slate-100 px-2 py-2">Xóa</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea) => (
              <tr key={idea.id} className="bg-white odd:bg-slate-50/50 hover:bg-emerald-50/40">
                <td className="border-b border-slate-100 px-2 py-1 align-top">
                  <input type="checkbox" checked={selected.has(idea.id)} onChange={() => toggleSelect(idea.id)} />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <TextCell value={idea.name} required onCommit={(v) => commit(idea.id, { name: v })} placeholder="Tên idea..." />
                  <div className="px-2 text-[11px] text-slate-400">{idea.is_saved ? '✅ Đã lưu' : 'Chưa lưu'}</div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell
                    value={idea.niche_id ?? ''}
                    options={catalog.niches.filter((n) => n.is_active).map((n) => n.id)}
                    onCommit={(v) => commit(idea.id, { niche_id: v, sub_niche_id: null })}
                  />
                  <div className="px-2 text-[11px] text-slate-400">
                    {catalog.niches.find((n) => n.id === idea.niche_id)?.name ?? ''}
                  </div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell
                    value={idea.sub_niche_id ?? ''}
                    placeholder="— Chọn —"
                    options={catalog.subNiches.filter((s) => s.niche_id === idea.niche_id && s.is_active).map((s) => s.id)}
                    onCommit={(v) => commit(idea.id, { sub_niche_id: v })}
                  />
                  <div className="px-2 text-[11px] text-slate-400">
                    {catalog.subNiches.find((s) => s.id === idea.sub_niche_id)?.name ?? ''}
                  </div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell
                    value={idea.product_type_id ?? ''}
                    placeholder="— Chọn —"
                    options={catalog.productTypes.filter((p) => p.is_active).map((p) => p.id)}
                    onCommit={(v) => commit(idea.id, { product_type_id: v })}
                  />
                  <div className="px-2 text-[11px] text-slate-400">
                    {catalog.productTypes.find((p) => p.id === idea.product_type_id)?.name ?? ''}
                  </div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <UrlCell value={idea.product_url ?? ''} onCommit={(v) => commit(idea.id, { product_url: v })} />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <TextCell value={idea.target_customer ?? ''} onCommit={(v) => commit(idea.id, { target_customer: v })} placeholder="Vd: Dog Owner" />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell value={idea.priority} options={PRIORITY_OPTIONS} onCommit={(v: Priority) => commit(idea.id, { priority: v })} />
                  <div className="px-2 py-0.5"><PriorityBadge value={idea.priority} /></div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell value={idea.status} options={STATUS_OPTIONS} onCommit={(v: Status) => commit(idea.id, { status: v })} />
                  <div className="px-2 py-0.5"><StatusBadge value={idea.status} /></div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <SelectCell
                    value={idea.assignee_id ?? ''}
                    placeholder="— Chọn —"
                    options={catalog.assignees.filter((a) => a.is_active).map((a) => a.id)}
                    onCommit={(v) => commit(idea.id, { assignee_id: v })}
                  />
                  <div className="px-2 text-[11px] text-slate-400">
                    {catalog.assignees.find((a) => a.id === idea.assignee_id)?.name ?? ''}
                  </div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEvaluate(idea, 'Oke')}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${idea.evaluation === 'Oke' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      Oke
                    </button>
                    <button
                      onClick={() => handleEvaluate(idea, 'Bình thường')}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${idea.evaluation === 'Bình thường' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                      Bình thường
                    </button>
                    <button
                      onClick={() => handleEvaluate(idea, 'Loại bỏ')}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${idea.evaluation === 'Loại bỏ' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      Loại bỏ
                    </button>
                  </div>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <TextAreaCell value={idea.notes ?? ''} onCommit={(v) => commit(idea.id, { notes: v })} />
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <button
                    onClick={() => handleSaveOne(idea)}
                    disabled={idea.is_saved}
                    className="rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40"
                  >
                    {idea.is_saved ? 'Đã lưu' : 'Lưu idea'}
                  </button>
                </td>
                <td className="border-b border-slate-100 px-1 py-1 align-top">
                  <button
                    onClick={() => {
                      setSelected(new Set([idea.id]))
                      setConfirmDeleteOpen(true)
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-sm text-slate-400">
                  Chưa có idea nào. Bấm "Thêm idea" để bắt đầu.
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
