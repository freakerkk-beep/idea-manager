import type { AiReport } from '../types'
import { parseAiReport } from '../services/aiReports'

interface AiReportModalProps {
  open: boolean
  title: string
  report: string
  loading: boolean
  error: string | null
  latestReport?: AiReport | null
  onClose: () => void
  onRegenerate?: () => void
  regenerateLabel?: string
}

function scoreClass(score: number) {
  if (score >= 7) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (score >= 5.5) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-red-200 bg-red-50 text-red-700'
}

function decisionClass(decision: string) {
  if (decision === 'Nên test') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (decision === 'Cần nghiên cứu thêm') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-red-200 bg-red-50 text-red-700'
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function formatCopyText(parsed: any, fallback: string) {
  if (!parsed) return fallback
  const lines = [
    `AI Tool: ${parsed.tool_label || ''}`,
    `Idea: ${parsed.idea_name || ''}`,
    `Sản phẩm: ${parsed.detected_product || ''}`,
    `Kết luận: ${parsed.quick_verdict || ''}`,
    `Quyết định: ${parsed.final_decision || ''}`,
    `Tổng điểm: ${parsed.overall_score ?? ''}/10`,
    `Mức tin cậy: ${parsed.confidence || ''}`,
    '',
  ]

  if (Array.isArray(parsed.score_table) && parsed.score_table.length) {
    lines.push('BẢNG ĐIỂM:')
    for (const row of parsed.score_table) {
      lines.push(`- ${row.criterion}: ${row.score}/10 (${row.weight}%) — ${row.comment}`)
    }
    lines.push('')
  }

  if (Array.isArray(parsed.similar_products) && parsed.similar_products.length) {
    lines.push('SẢN PHẨM TƯƠNG TỰ:')
    for (const item of parsed.similar_products) {
      lines.push(`- ${item.product_name} | ${item.platform} | ${item.price_range} | ${item.strength} | ${item.weakness}`)
    }
    lines.push('')
  }

  if (Array.isArray(parsed.angle_table) && parsed.angle_table.length) {
    lines.push('ANGLE:')
    for (const item of parsed.angle_table) {
      lines.push(`- ${item.angle_type}: ${item.hook} | Visual: ${item.visual_idea} | Risk: ${item.risk}`)
    }
    lines.push('')
  }

  if (Array.isArray(parsed.next_actions) && parsed.next_actions.length) {
    lines.push('NEXT ACTION:')
    for (const item of parsed.next_actions) lines.push(`- ${item}`)
  }

  return lines.join('\n')
}

function renderBullets(items: string[]) {
  if (!items.length) return <p className="text-sm text-slate-400">Không có dữ liệu.</p>
  return (
    <ul className="space-y-1 text-sm text-slate-700">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function AiStructuredReport({ data }: { data: any }) {
  const score = Number(data.overall_score ?? 0)
  const assumptions = asArray(data.assumptions)
  const redFlags = asArray(data.red_flags)
  const nextActions = asArray(data.next_actions)
  const scoreTable = Array.isArray(data.score_table) ? data.score_table : []
  const similarProducts = Array.isArray(data.similar_products) ? data.similar_products : []
  const angleTable = Array.isArray(data.angle_table) ? data.angle_table : []
  const decisionTable = Array.isArray(data.decision_table) ? data.decision_table : []
  const detailSections = Array.isArray(data.detail_sections) ? data.detail_sections : []

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI hiểu sản phẩm</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{data.detected_product || '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kết luận nhanh</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{data.quick_verdict || '—'}</p>
        </div>
        <div className={`rounded-xl border p-4 ${scoreClass(score)}`}>
          <p className="text-xs font-semibold uppercase tracking-wide">Tổng điểm</p>
          <p className="mt-2 text-3xl font-bold">{Number.isFinite(score) ? score.toFixed(1) : '—'}/10</p>
          <p className="mt-1 text-sm font-semibold">{data.final_decision || '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mức tin cậy</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{data.confidence || '—'}</p>
          {data.tool_label && <p className="mt-1 text-xs text-slate-500">{data.tool_label}</p>}
        </div>
      </div>

      {scoreTable.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Bảng chấm điểm</h3>
            <p className="mt-1 text-xs text-slate-500">Chấm theo từng tiêu chí rồi mới tính tổng điểm. AI được yêu cầu đánh giá bảo thủ, không nịnh.</p>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2">Tiêu chí</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center">Điểm /10</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center">Trọng số</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center">Quy đổi</th>
                  <th className="border-b border-slate-200 px-3 py-2">Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {scoreTable.map((row: any, index: number) => {
                  const rowScore = Number(row.score ?? 0)
                  return (
                    <tr key={`${row.criterion}-${index}`}>
                      <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-800">{row.criterion}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreClass(rowScore)}`}>
                          {Number.isFinite(rowScore) ? rowScore.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center text-slate-600">{row.weight}%</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center font-medium text-slate-700">{Number(row.weighted_score ?? 0).toFixed(2)}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{row.comment}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {similarProducts.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Sản phẩm tương tự / đối thủ cần kiểm tra</h3>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2">Sản phẩm</th>
                  <th className="border-b border-slate-200 px-3 py-2">Nền tảng</th>
                  <th className="border-b border-slate-200 px-3 py-2">Giá</th>
                  <th className="border-b border-slate-200 px-3 py-2">Điểm mạnh</th>
                  <th className="border-b border-slate-200 px-3 py-2">Điểm yếu</th>
                  <th className="border-b border-slate-200 px-3 py-2">Cơ hội khác biệt</th>
                </tr>
              </thead>
              <tbody>
                {similarProducts.map((item: any, index: number) => (
                  <tr key={`${item.product_name}-${index}`}>
                    <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-800">{item.product_name || item.link_or_search_hint || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.platform || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.price_range || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.strength || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.weakness || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.differentiation_chance || item.link_or_search_hint || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {angleTable.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Content / Ads angle</h3>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2">Loại angle</th>
                  <th className="border-b border-slate-200 px-3 py-2">Hook</th>
                  <th className="border-b border-slate-200 px-3 py-2">Visual</th>
                  <th className="border-b border-slate-200 px-3 py-2">Vì sao có thể hiệu quả</th>
                  <th className="border-b border-slate-200 px-3 py-2">Rủi ro</th>
                </tr>
              </thead>
              <tbody>
                {angleTable.map((item: any, index: number) => (
                  <tr key={`${item.angle_type}-${index}`}>
                    <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-800">{item.angle_type || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.hook || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.visual_idea || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.why_it_might_work || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{item.risk || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {decisionTable.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Đề xuất quyết định</h3>
          </div>
          <table className="min-w-full text-sm">
            <tbody>
              {decisionTable.map((item: any, index: number) => (
                <tr key={`${item.field}-${index}`}>
                  <td className="w-48 border-b border-slate-100 bg-slate-50 px-3 py-2 font-medium text-slate-700">{item.field}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Red flags</h3>
          {renderBullets(redFlags)}
        </section>
        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Next action</h3>
          {renderBullets(nextActions)}
        </section>
      </div>

      {assumptions.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-amber-800">Giả định / dữ liệu thiếu</h3>
          {renderBullets(assumptions)}
        </section>
      )}

      {detailSections.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {detailSections.map((section: any, index: number) => (
            <section key={`${section.title}-${index}`} className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">{section.title}</h3>
              {renderBullets(asArray(section.bullets))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
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
  regenerateLabel,
}: AiReportModalProps) {
  if (!open) return null

  const text = report || latestReport?.report_markdown || ''
  const parsed = parseAiReport(text)

  async function copyReport() {
    if (!text) return
    await navigator.clipboard.writeText(formatCopyText(parsed, text))
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI kiểm tra</h2>
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
              AI đang kiểm tra idea. Hệ thống sẽ tự đọc dữ liệu hiện có, đánh giá bảo thủ và trả kết quả dạng bảng. Có thể mất 15–60 giây.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && parsed && <AiStructuredReport data={parsed} />}

          {!loading && !error && !parsed && text && (
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
              {loading ? 'Đang kiểm tra...' : regenerateLabel || (text ? 'Chạy lại' : 'AI kiểm tra')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
