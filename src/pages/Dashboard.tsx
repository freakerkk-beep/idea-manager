import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppData } from '../hooks/useAppData'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { STATUS_OPTIONS } from '../types'

function StatCard({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:shadow-sm"
    >
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </button>
  )
}

export function Dashboard() {
  const { catalog, ideas } = useAppData()
  const navigate = useNavigate()

  const live = ideas.filter((i) => i.status !== 'Đã loại bỏ')

  const stats = useMemo(() => {
    return {
      total: ideas.length,
      saved: ideas.filter((i) => i.is_saved).length,
      ok: live.filter((i) => i.evaluation === 'Oke').length,
      normal: live.filter((i) => i.evaluation === 'Bình thường').length,
      researching: live.filter((i) => i.status === 'Đang nghiên cứu').length,
      rd: live.filter((i) => i.status === 'Đã chọn R&D').length,
      prototype: live.filter((i) => i.status === 'Đang prototype').length,
      approved: live.filter((i) => i.status === 'Đã duyệt').length,
      removed: ideas.filter((i) => i.status === 'Đã loại bỏ').length,
      unassigned: live.filter((i) => !i.assignee_id).length,
      highPriority: live.filter((i) => i.priority === 'Cao').length,
    }
  }, [ideas, live])

  const byNiche = catalog.niches
    .filter((n) => n.is_active)
    .map((n) => ({ name: n.name, count: live.filter((i) => i.niche_id === n.id).length }))

  const byStatus = STATUS_OPTIONS.filter((s) => s !== 'Đã loại bỏ').map((s) => ({
    status: s,
    count: live.filter((i) => i.status === s).length,
  }))

  const recentSaved = [...ideas]
    .filter((i) => i.is_saved && i.saved_at)
    .sort((a, b) => new Date(b.saved_at!).getTime() - new Date(a.saved_at!).getTime())
    .slice(0, 10)

  const needAttention = {
    highNoAssignee: live.filter((i) => i.priority === 'Cao' && !i.assignee_id),
    okNotSaved: live.filter((i) => i.evaluation === 'Oke' && !i.is_saved),
    savedButNew: ideas.filter((i) => i.is_saved && i.status === 'Idea mới'),
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
      <p className="text-sm text-slate-500">Tổng quan tình hình ý tưởng sản phẩm.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Tổng số idea" value={stats.total} onClick={() => navigate('/saved')} />
        <StatCard label="Idea đã lưu" value={stats.saved} onClick={() => navigate('/saved')} />
        <StatCard label="Đánh giá Oke" value={stats.ok} />
        <StatCard label="Đánh giá Bình thường" value={stats.normal} />
        <StatCard label="Đang nghiên cứu" value={stats.researching} />
        <StatCard label="Đã chọn R&D" value={stats.rd} />
        <StatCard label="Đang prototype" value={stats.prototype} />
        <StatCard label="Đã duyệt" value={stats.approved} />
        <StatCard label="Đã loại bỏ" value={stats.removed} onClick={() => navigate('/trash')} />
        <StatCard label="Chưa phân công" value={stats.unassigned} />
        <StatCard label="Ưu tiên cao" value={stats.highPriority} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Idea theo niche</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byNiche}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2f6f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Idea theo trạng thái</h2>
          <ul className="space-y-1.5">
            {byStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between text-sm">
                <StatusBadge value={s.status} />
                <span className="font-medium text-slate-700">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Idea mới được lưu</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {recentSaved.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                <div>
                  <div className="font-medium text-slate-800">{i.name}</div>
                  <div className="text-xs text-slate-500">
                    {catalog.niches.find((n) => n.id === i.niche_id)?.name ?? '—'} ·{' '}
                    {catalog.assignees.find((a) => a.id === i.assignee_id)?.name ?? 'Chưa phân công'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge value={i.priority} />
                  <StatusBadge value={i.status} />
                </div>
              </li>
            ))}
            {recentSaved.length === 0 && <li className="py-3 text-sm text-slate-400">Chưa có idea nào được lưu.</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Idea cần chú ý</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium text-slate-700">Ưu tiên cao, chưa có người phụ trách ({needAttention.highNoAssignee.length})</div>
              <ul className="mt-1 space-y-0.5 text-slate-600">
                {needAttention.highNoAssignee.slice(0, 5).map((i) => (
                  <li key={i.id}>• {i.name || '(chưa đặt tên)'}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium text-slate-700">Đánh giá Oke nhưng chưa lưu ({needAttention.okNotSaved.length})</div>
              <ul className="mt-1 space-y-0.5 text-slate-600">
                {needAttention.okNotSaved.slice(0, 5).map((i) => (
                  <li key={i.id}>• {i.name || '(chưa đặt tên)'}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium text-slate-700">Đã lưu nhưng vẫn ở "Idea mới" ({needAttention.savedButNew.length})</div>
              <ul className="mt-1 space-y-0.5 text-slate-600">
                {needAttention.savedButNew.slice(0, 5).map((i) => (
                  <li key={i.id}>• {i.name || '(chưa đặt tên)'}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
