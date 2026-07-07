import { useMemo, useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'
import { hardDeleteIdea, restoreIdea } from '../services/ideas'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Idea } from '../types'

export function TrashPage() {
  const { catalog, ideas, refetchIdeas } = useAppData()
  const { showToast } = useToast()
  const [confirmTarget, setConfirmTarget] = useState<Idea | null>(null)

  const removed = useMemo(() => ideas.filter((i) => i.status === 'Đã loại bỏ'), [ideas])

  async function handleRestore(idea: Idea) {
    try {
      await restoreIdea(idea.id)
      await refetchIdeas()
      showToast('Đã khôi phục idea', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể khôi phục idea', 'error')
    }
  }

  async function handleHardDelete() {
    if (!confirmTarget) return
    try {
      await hardDeleteIdea(confirmTarget.id)
      await refetchIdeas()
      showToast('Đã xóa vĩnh viễn', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể xóa idea', 'error')
    } finally {
      setConfirmTarget(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Idea đã loại bỏ</h1>
        <p className="text-sm text-slate-500">{removed.length} idea</p>
      </header>

      <div className="table-scroll flex-1 overflow-auto px-6 py-4">
        <table className="idea-grid-table min-w-[1100px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2">Tên idea</th>
              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2">Niche</th>
              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2">Loại sản phẩm</th>
              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2">Owner</th>
              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2">Ghi chú</th>
              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2">Ngày cập nhật</th>
              <th className="border-b border-slate-200 bg-slate-100 px-3 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {removed.map((idea) => (
              <tr key={idea.id} className="bg-white odd:bg-slate-50/50">
                <td className="border-b border-slate-100 px-3 py-2">{idea.name || <em className="text-slate-400">(chưa đặt tên)</em>}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-600">
                  {catalog.niches.find((n) => n.id === idea.niche_id)?.name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-600">
                  {catalog.productTypes.find((p) => p.id === idea.product_type_id)?.name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-600">
                  {catalog.assignees.find((a) => a.id === idea.assignee_id)?.name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-600">{idea.notes || '—'}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-500">
                  {new Date(idea.updated_at).toLocaleString('vi-VN')}
                </td>
                <td className="border-b border-slate-100 px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(idea)}
                      className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-800"
                    >
                      Khôi phục
                    </button>
                    <button
                      onClick={() => setConfirmTarget(idea)}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Xóa vĩnh viễn
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {removed.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  Không có idea nào bị loại bỏ.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Xóa vĩnh viễn idea?"
        message={`Idea "${confirmTarget?.name || '(chưa đặt tên)'}" sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
        confirmLabel="Xóa vĩnh viễn"
        danger
        onConfirm={handleHardDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
