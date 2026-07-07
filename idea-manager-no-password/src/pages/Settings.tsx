import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'
import {
  createAssignee,
  createNiche,
  createProductType,
  createSubNiche,
  deleteNiche,
  deleteProductType,
  deleteSubNiche,
  updateAssignee,
  updateNiche,
  updateProductType,
  updateSubNiche,
} from '../services/catalog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Assignee, Niche, ProductType, SubNiche } from '../types'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onAdd(value.trim())
            setValue('')
          }
        }}
      />
      <button
        onClick={() => {
          if (value.trim()) {
            onAdd(value.trim())
            setValue('')
          }
        }}
        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Thêm
      </button>
    </div>
  )
}

interface Row {
  id: string
  name: string
  is_active: boolean
}

function EditableList({
  rows,
  onRename,
  onToggleActive,
  onDelete,
}: {
  rows: Row[]
  onRename: (id: string, name: string) => void
  onToggleActive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <ul className="mt-3 divide-y divide-slate-100">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 py-2">
          <input
            defaultValue={r.name}
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== r.name) onRename(r.id, e.target.value.trim())
            }}
            className={
              'flex-1 rounded-md border border-transparent px-2 py-1 text-sm hover:bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none ' +
              (r.is_active ? '' : 'text-slate-400 line-through')
            }
          />
          <button
            onClick={() => onToggleActive(r.id, !r.is_active)}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {r.is_active ? 'Ẩn' : 'Hiện'}
          </button>
          <button
            onClick={() => onDelete(r.id)}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Xóa
          </button>
        </li>
      ))}
      {rows.length === 0 && <li className="py-2 text-sm text-slate-400">Chưa có mục nào.</li>}
    </ul>
  )
}

export function Settings() {
  const { catalog, refetchCatalog } = useAppData()
  const { showToast } = useToast()
  const [selectedNicheForSub, setSelectedNicheForSub] = useState<string>(catalog.niches[0]?.id ?? '')
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'niche' | 'sub' | 'product'; id: string; name: string } | null>(null)

  async function guarded(fn: () => Promise<unknown>, successMsg: string) {
    try {
      await fn()
      await refetchCatalog()
      showToast(successMsg, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Có lỗi xảy ra', 'error')
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return
    const { kind, id } = confirmDelete
    setConfirmDelete(null)
    if (kind === 'niche') await guarded(() => deleteNiche(id), 'Đã xóa niche')
    if (kind === 'sub') await guarded(() => deleteSubNiche(id), 'Đã xóa niche con')
    if (kind === 'product') await guarded(() => deleteProductType(id), 'Đã xóa loại sản phẩm')
  }

  const nicheRows: Row[] = catalog.niches.map((n: Niche) => ({ id: n.id, name: n.name, is_active: n.is_active }))
  const subNicheRows: Row[] = catalog.subNiches
    .filter((s: SubNiche) => s.niche_id === selectedNicheForSub)
    .map((s) => ({ id: s.id, name: s.name, is_active: s.is_active }))
  const productTypeRows: Row[] = catalog.productTypes.map((p: ProductType) => ({ id: p.id, name: p.name, is_active: p.is_active }))
  const assigneeRows: Row[] = catalog.assignees.map((a: Assignee) => ({ id: a.id, name: a.name, is_active: a.is_active }))

  return (
    <div className="h-full overflow-y-auto">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Cài đặt danh mục</h1>
        <p className="text-sm text-slate-500">Quản lý niche, niche con, loại sản phẩm và người phụ trách.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
        <SectionCard title="Niche chính">
          <AddRow placeholder="Tên niche mới..." onAdd={(name) => guarded(() => createNiche(name), 'Đã thêm niche')} />
          <EditableList
            rows={nicheRows}
            onRename={(id, name) => guarded(() => updateNiche(id, { name }), 'Đã cập nhật niche')}
            onToggleActive={(id, active) => guarded(() => updateNiche(id, { is_active: active }), active ? 'Đã hiện niche' : 'Đã ẩn niche')}
            onDelete={(id) => {
              const n = catalog.niches.find((x) => x.id === id)
              setConfirmDelete({ kind: 'niche', id, name: n?.name ?? '' })
            }}
          />
        </SectionCard>

        <SectionCard title="Niche con">
          <select
            value={selectedNicheForSub}
            onChange={(e) => setSelectedNicheForSub(e.target.value)}
            className="mb-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {catalog.niches.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          <AddRow
            placeholder="Tên niche con mới..."
            onAdd={(name) => guarded(() => createSubNiche(selectedNicheForSub, name), 'Đã thêm niche con')}
          />
          <EditableList
            rows={subNicheRows}
            onRename={(id, name) => guarded(() => updateSubNiche(id, { name }), 'Đã cập nhật niche con')}
            onToggleActive={(id, active) => guarded(() => updateSubNiche(id, { is_active: active }), active ? 'Đã hiện' : 'Đã ẩn')}
            onDelete={(id) => {
              const s = catalog.subNiches.find((x) => x.id === id)
              setConfirmDelete({ kind: 'sub', id, name: s?.name ?? '' })
            }}
          />
        </SectionCard>

        <SectionCard title="Loại sản phẩm">
          <AddRow placeholder="Loại sản phẩm mới..." onAdd={(name) => guarded(() => createProductType(name), 'Đã thêm loại sản phẩm')} />
          <EditableList
            rows={productTypeRows}
            onRename={(id, name) => guarded(() => updateProductType(id, { name }), 'Đã cập nhật')}
            onToggleActive={(id, active) => guarded(() => updateProductType(id, { is_active: active }), active ? 'Đã hiện' : 'Đã ẩn')}
            onDelete={(id) => {
              const p = catalog.productTypes.find((x) => x.id === id)
              setConfirmDelete({ kind: 'product', id, name: p?.name ?? '' })
            }}
          />
        </SectionCard>

        <SectionCard title="Người phụ trách">
          <AddRow placeholder="Tên người phụ trách mới..." onAdd={(name) => guarded(() => createAssignee(name), 'Đã thêm người phụ trách')} />
          <ul className="mt-3 divide-y divide-slate-100">
            {assigneeRows.map((a) => (
              <li key={a.id} className="flex items-center gap-2 py-2">
                <input
                  defaultValue={a.name}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== a.name)
                      guarded(() => updateAssignee(a.id, { name: e.target.value.trim() }), 'Đã cập nhật')
                  }}
                  className={
                    'flex-1 rounded-md border border-transparent px-2 py-1 text-sm hover:bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none ' +
                    (a.is_active ? '' : 'text-slate-400 line-through')
                  }
                />
                <button
                  onClick={() => guarded(() => updateAssignee(a.id, { is_active: !a.is_active }), a.is_active ? 'Đã ẩn' : 'Đã hiện')}
                  className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {a.is_active ? 'Ẩn' : 'Hiện'}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400">Người phụ trách không dùng tài khoản riêng — chỉ là nhãn để phân công idea.</p>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa mục này?"
        message={`Bạn có chắc muốn xóa "${confirmDelete?.name}"? Nếu đang có idea sử dụng, hệ thống sẽ báo lỗi và bạn nên ẩn thay vì xóa.`}
        confirmLabel="Xóa"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
