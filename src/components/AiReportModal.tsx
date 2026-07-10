import type { AiReport } from '../types'

interface AiReportModalProps {
  open: boolean
  title: string
  report: string
  loading: boolean
  error: string | null
  latestReport?: AiReport | null
  onClose: () => void
  onRegenerate?: () => void
}

export function AiReportModal({
  open,
  title,
  report,
  loading,
  error,
  latestReport,
  onClose,
  onRegenerate,
}: AiReportModalProps) {
  if (!open) return null

  const text = report || latestReport?.report_markdown || ''

  async function copyReport() {
    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tự động phân tích</h2>
            <p className="mt-1 text-sm text-slate-500">{title}</p>
            {latestReport && !loading && (
              <p className="mt-1 text-xs text-slate-400">
                Report gần nhất: {new Date(latestReport.created_at).toLocaleString('vi-VN')}
                {latestReport.score != null ? ` · Điểm ${latestReport.score}/10` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          {loading && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              AI đang tự nhận diện sản phẩm từ tên idea/link/niche, phân tích thị trường và tạo chiến lược bán hàng. Có thể mất 15–60 giây.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && text && (
            <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-800">
              {text}
            </pre>
          )}

          {!loading && !error && !text && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Chưa có AI report cho idea này.
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">
          {text && (
            <button
              onClick={copyReport}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Copy report
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? 'Đang phân tích...' : text ? 'Phân tích lại' : 'Tự động phân tích'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
