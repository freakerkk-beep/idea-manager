import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'
import {
  createEmptyIdea,
  hardDeleteIdea,
  hardDeleteIdeas,
  saveIdeaSnapshots,
  updateIdea,
} from '../services/ideas'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { SelectCell, TextAreaCell, TextCell, UrlCell } from '../components/cells'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PRIORITY_OPTIONS, STATUS_OPTIONS, type Idea, type Priority, type Status } from '../types'

function rowPriorityClass(priority: Priority) {
  if (priority === 'Cao') return 'priority-row-high'
  if (priority === 'Trung bình') return 'priority-row-medium'
  return ''
}

export function NichePage() {
  const { nicheId } = useParams<{ nicheId: string }>()
  const { catalog, ideas, savedIdeas, refetchIdeas, refetchSavedIdeas } = useAppData()
  const { showToast } = useToast()

  const niche = catalog.niches.find((n) => n.id === nicheId)
  const subNichesForNiche = catalog.subNiches.filter((s) => s.niche_id === nicheId && s.is_active)

  const nicheIdeas = useMemo(
    () => ideas.filter((i) => i.niche_id === nicheId && i.status !== 'Đã loại bỏ'),
    [ideas, nicheId]
  )

  const savedSourceIds = useMemo(
    () => new Set(savedIdeas.map((idea) => idea.source_idea_id).filter(Boolean)),
    [savedIdeas]
  )

  const [search, setSearch] = useState('')
  const [subNicheFilter, setSubNicheFilter] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [focusIdeaId, setFocusIdeaId] = useState<string | null>(null)

  const filtered = nicheIdeas.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (subNicheFilter && i.sub_niche_id !== subNicheFilter) return false
    if (productTypeFilter && i.product_type_id !== productTypeFilter) return false
    if (priorityFilter && i.priority !== priorityFilter) return false
    if (statusFilter && i.status !== statusFilter) return false
    if (assigneeFilter && i.assignee_id !== assigneeFilter) return false
    return true
  })

  useEffect(() => {
    if (!focusIdeaId) return
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`idea-row-${focusIdeaId}`)
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      row?.querySelector<HTMLInputElement>('input:not([type="checkbox"])')?.focus()
      setFocusIdeaId(null)
    }, 80)
    return () => window.clearTimeout(timer)
  }, [focusIdeaId, filtered])

  function clearFiltersForNewRow() {
    setSearch('')
    setSubNicheFilter('')
    setProductTypeFilter('')
    setPriorityFilter('')
    setStatusFilter('')
    setAssigneeFilter('')
  }

  async function handleAddIdea() {
    try {
      clearFiltersForNewRow()
      const created = await createEmptyIdea(nicheId ?? null)
      setFocusIdeaId(created.id)
      await refetchIdeas()
      showToast('Đã thêm một hàng idea mới', 'success')
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

  async function handleSaveSelected() {
    const rows = filtered.filter((i) => selected.has(i.id))
    const missingName = rows.some((r) => !r.name.trim())
    if (missingName) {
      showToast('Một số idea chưa có tên nên không thể lưu', 'error')
      return
    }
    try {
      await saveIdeaSnapshots(rows, catalog)
      await refetchSavedIdeas()
      setSelected(new Set())
      showToast(`Đã lưu vĩnh viễn ${rows.length} idea vào tab Idea đã lưu`, 'success')
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
      showToast('Đã dọn idea khỏi niche; các bản đã lưu vẫn được giữ nguyên', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể xóa idea', 'error')
    }
  }

  async function handleQuickDelete(id: string) {
    try {
      await hardDeleteIdea(id)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await refetchIdeas()
      showToast('Đã xóa nhanh idea khỏi niche; bản đã lưu vẫn được giữ nguyên', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể xóa idea', 'error')
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
          Dọn các idea đã chọn
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
          <option value="">Tất cả Owner</option>
          {catalog.assignees.filter((a) => a.is_active).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="table-scroll flex-1 overflow-auto px-6 py-4">
        <table className="idea-grid-table min-w-[1450px] border-separate border-spacing-0 text-sm">
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
              <th className="sticky top-0 min-w-[140px] border-b border-slate-200 bg-slate-100 px-2 py-2">Owner</th>
              <th className="sticky top-0 min-w-[180px] border-b border-slate-200 bg-slate-100 px-2 py-2">Ghi chú</th>
              <th className="sticky top-0 w-20 border-b border-slate-200 bg-slate-100 px-2 py-2 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea) => (
              <tr key={idea.id} id={`idea-row-${idea.id}`} className={rowPriorityClass(idea.priority)}>
                  <td className="px-2 py-1 align-top">
                    <input type="checkbox" checked={selected.has(idea.id)} onChange={() => toggleSelect(idea.id)} />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <TextCell value={idea.name} required onCommit={(v) => commit(idea.id, { name: v })} placeholder="Tên idea..." />
                    <div className="px-2 text-[11px] text-slate-400">{savedSourceIds.has(idea.id) ? '✅ Đã lưu vĩnh viễn' : 'Chưa lưu'}</div>
                  </td>
                  <td className="px-1 py-1 align-top">
                    <SelectCell
                      value={idea.niche_id ?? ''}
                      options={catalog.niches
                        .filter((n) => n.is_active)
                        .map((n) => ({ value: n.id, label: n.name }))}
                      onCommit={(v) => commit(idea.id, { niche_id: v, sub_niche_id: null })}
                    />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <SelectCell
                      value={idea.sub_niche_id ?? ''}
                      placeholder="— Chọn —"
                      options={catalog.subNiches
                        .filter((s) => s.niche_id === idea.niche_id && s.is_active)
                        .map((s) => ({ value: s.id, label: s.name }))}
                      onCommit={(v) => commit(idea.id, { sub_niche_id: v })}
                    />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <SelectCell
                      value={idea.product_type_id ?? ''}
                      placeholder="— Chọn —"
                      options={catalog.productTypes
                        .filter((p) => p.is_active)
                        .map((p) => ({ value: p.id, label: p.name }))}
                      onCommit={(v) => commit(idea.id, { product_type_id: v })}
                    />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <UrlCell value={idea.product_url ?? ''} onCommit={(v) => commit(idea.id, { product_url: v })} />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <TextCell value={idea.target_customer ?? ''} onCommit={(v) => commit(idea.id, { target_customer: v })} placeholder="Vd: Dog Owner" />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <SelectCell value={idea.priority} options={PRIORITY_OPTIONS} onCommit={(v: Priority) => commit(idea.id, { priority: v })} />
                    <div className="px-2 py-0.5"><PriorityBadge value={idea.priority} /></div>
                  </td>
                  <td className="px-1 py-1 align-top">
                    <SelectCell value={idea.status} options={STATUS_OPTIONS} onCommit={(v: Status) => commit(idea.id, { status: v })} />
                    <div className="px-2 py-0.5"><StatusBadge value={idea.status} /></div>
                  </td>
                  <td className="px-1 py-1 align-top">
                    <SelectCell
                      value={idea.assignee_id ?? ''}
                      placeholder="— Chọn —"
                      options={catalog.assignees
                        .filter((a) => a.is_active)
                        .map((a) => ({ value: a.id, label: a.name }))}
                      onCommit={(v) => commit(idea.id, { assignee_id: v })}
                    />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <TextAreaCell value={idea.notes ?? ''} onCommit={(v) => commit(idea.id, { notes: v })} />
                  </td>
                  <td className="px-2 py-2 text-center align-top">
                    <button
                      onClick={() => handleQuickDelete(idea.id)}
                      className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      title="Xóa nhanh idea khỏi niche"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>

        <div className="idea-add-footer min-w-[1450px]">
          <button
            onClick={handleAddIdea}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-emerald-300 bg-white px-4 text-xs font-medium text-emerald-700 shadow-sm hover:border-emerald-500 hover:bg-emerald-50"
            title="Luôn thêm một hàng idea mới ở cuối danh sách"
          >
            <span className="text-base leading-none">+</span>
            {filtered.length === 0 ? 'Thêm idea đầu tiên' : 'Thêm hàng ở cuối'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Dọn idea khỏi niche?"
        message={`Bạn sắp dọn ${selected.size} idea khỏi niche. Bản đã lưu trong tab Idea đã lưu vẫn được giữ nguyên.`}
        confirmLabel="Dọn khỏi niche"
        danger
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  )
}
