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
import { AddableSelectCell, type AddableSelectOption } from '../components/AddableSelectCell'
import { SelectCell, TextAreaCell, TextCell, UrlCell } from '../components/cells'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PRIORITY_OPTIONS, type Idea, type Priority } from '../types'
import { createNiche, createProductType, createStatusOption, createSubNiche } from '../services/catalog'

function rowPriorityClass(priority: Priority) {
  if (priority === 'Cao') return 'priority-row-high'
  if (priority === 'Trung bình') return 'priority-row-medium'
  return ''
}

export function NichePage() {
  const { nicheId } = useParams<{ nicheId: string }>()
  const { catalog, ideas, savedIdeas, refetchCatalog, refetchIdeas, refetchSavedIdeas } = useAppData()
  const { showToast } = useToast()

  const niche = catalog.niches.find((n) => n.id === nicheId)
  const subNichesForNiche = catalog.subNiches.filter((s) => s.niche_id === nicheId && s.is_active)

  const nicheIdeas = useMemo(
    () =>
      ideas
        .filter((i) => i.niche_id === nicheId && i.status !== 'Đã loại bỏ')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [ideas, nicheId]
  )

  const savedSourceIds = useMemo(
    () => new Set(savedIdeas.map((idea) => idea.source_idea_id).filter(Boolean)),
    [savedIdeas]
  )

  const statusNames = useMemo(() => {
    const names = [
      ...catalog.statusOptions.filter((status) => status.is_active).map((status) => status.name),
      ...nicheIdeas.map((idea) => idea.status),
    ]
    return Array.from(new Set(names.filter(Boolean)))
  }, [catalog.statusOptions, nicheIdeas])

  const [search, setSearch] = useState('')
  const [subNicheFilter, setSubNicheFilter] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [focusIdeaId, setFocusIdeaId] = useState<string | null>(null)
  const [isAddingIdea, setIsAddingIdea] = useState(false)

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

  async function addNicheOption(name: string): Promise<AddableSelectOption> {
    const created = await createNiche(name)
    await refetchCatalog()
    showToast(`Đã thêm niche “${created.name}”`, 'success')
    return { value: created.id, label: created.name }
  }

  async function addSubNicheOption(nicheIdForNewOption: string, name: string): Promise<AddableSelectOption> {
    const created = await createSubNiche(nicheIdForNewOption, name)
    await refetchCatalog()
    showToast(`Đã thêm niche con “${created.name}”`, 'success')
    return { value: created.id, label: created.name }
  }

  async function addProductTypeOption(name: string): Promise<AddableSelectOption> {
    const created = await createProductType(name)
    await refetchCatalog()
    showToast(`Đã thêm loại sản phẩm “${created.name}”`, 'success')
    return { value: created.id, label: created.name }
  }

  async function addStatusOption(name: string): Promise<AddableSelectOption> {
    const created = await createStatusOption(name)
    await refetchCatalog()
    showToast(`Đã thêm trạng thái “${created.name}”`, 'success')
    return { value: created.name, label: created.name }
  }

  function clearFiltersForNewRow() {
    setSearch('')
    setSubNicheFilter('')
    setProductTypeFilter('')
    setPriorityFilter('')
    setStatusFilter('')
    setAssigneeFilter('')
  }

  async function handleAddIdea() {
    if (isAddingIdea) return
    setIsAddingIdea(true)
    try {
      clearFiltersForNewRow()
      const created = await createEmptyIdea(nicheId ?? null)
      setFocusIdeaId(created.id)
      await refetchIdeas()
      showToast('Đã thêm một hàng idea mới ở cuối bảng', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể thêm idea', 'error')
    } finally {
      setIsAddingIdea(false)
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
          {statusNames.map((status) => <option key={status} value={status}>{status}</option>)}
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
                    <AddableSelectCell
                      value={idea.niche_id ?? ''}
                      placeholder="— Chọn —"
                      options={catalog.niches
                        .filter((n) => n.is_active || n.id === idea.niche_id)
                        .map((n) => ({ value: n.id, label: n.name }))}
                      onCommit={(value) => commit(idea.id, { niche_id: value || null, sub_niche_id: null })}
                      addLabel="Thêm niche chính"
                      addPlaceholder="Tên niche chính mới..."
                      onAdd={addNicheOption}
                    />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <AddableSelectCell
                      value={idea.sub_niche_id ?? ''}
                      placeholder="— Chọn —"
                      options={catalog.subNiches
                        .filter((s) => s.niche_id === idea.niche_id && (s.is_active || s.id === idea.sub_niche_id))
                        .map((s) => ({ value: s.id, label: s.name }))}
                      onCommit={(value) => commit(idea.id, { sub_niche_id: value || null })}
                      addLabel="Thêm niche con"
                      addPlaceholder="Tên niche con mới..."
                      addDisabled={!idea.niche_id}
                      addDisabledMessage="Chọn niche chính trước"
                      onAdd={(name) => {
                        if (!idea.niche_id) throw new Error('Hãy chọn niche chính trước khi thêm niche con.')
                        return addSubNicheOption(idea.niche_id, name)
                      }}
                    />
                  </td>
                  <td className="px-1 py-1 align-top">
                    <AddableSelectCell
                      value={idea.product_type_id ?? ''}
                      placeholder="— Chọn —"
                      options={catalog.productTypes
                        .filter((p) => p.is_active || p.id === idea.product_type_id)
                        .map((p) => ({ value: p.id, label: p.name }))}
                      onCommit={(value) => commit(idea.id, { product_type_id: value || null })}
                      addLabel="Thêm loại sản phẩm"
                      addPlaceholder="Tên loại sản phẩm mới..."
                      onAdd={addProductTypeOption}
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
                    <AddableSelectCell
                      value={idea.status}
                      placeholder="— Chọn —"
                      options={statusNames.map((status) => ({ value: status, label: status }))}
                      onCommit={(value) => commit(idea.id, { status: value || 'Idea mới' })}
                      addLabel="Thêm trạng thái xử lý"
                      addPlaceholder="Tên trạng thái mới..."
                      onAdd={addStatusOption}
                    />
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

        <div className="idea-add-sticky">
          <div className="idea-add-sticky-note">
            Hàng mới luôn nằm ở cuối bảng — không chèn giữa idea của người khác.
          </div>
          <button
            onClick={handleAddIdea}
            disabled={isAddingIdea}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
            title="Nút luôn hiển thị khi cuộn; hàng mới được thêm ở cuối và tự động đưa bạn tới ô nhập tên"
          >
            <span className="text-lg leading-none">+</span>
            {isAddingIdea
              ? 'Đang thêm...'
              : filtered.length === 0
                ? 'Thêm idea đầu tiên'
                : 'Thêm idea ở cuối'}
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
