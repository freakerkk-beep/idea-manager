import { useMemo } from 'react'
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

type Confidence = 'low' | 'medium' | 'high'

interface StructuredAiReport {
  product_summary: {
    idea_name: string
    detected_product: string
    quick_verdict: string
    overall_score: number
    confidence: Confidence
    assumptions: string[]
    red_flags: string[]
  }
  score_table: Array<{
    criterion: string
    score: number
    weight: number
    weighted_score: number
    summary: string
  }>
  details: {
    target_customer: string[]
    pain_point: string[]
    market_seasonality: string[]
    usp: string[]
    content_angle: string[]
    ads_angle: string[]
    pricing_bundle_upsell: string[]
    risks: string[]
    next_action: string[]
  }
}

function parseStructuredReport(text: string): StructuredAiReport | null {
  if (!text) return null
  try {
    const parsed = JSON.parse(text)
    if (!parsed?.product_summary || !Array.isArray(parsed?.score_table) || !parsed?.details) return null
    return parsed as StructuredAiReport
  } catch {
    return null
  }
}

function confidenceLabel(confidence: Confidence) {
  if (confidence === 'high') return 'Cao'
  if (confidence === 'low') return 'Thấp'
  return 'Trung bình'
}

function verdictBand(score: number) {
  if (score >= 8) return 'Rất đáng ưu tiên'
  if (score >= 6.5) return 'Có tiềm năng, nên test'
  if (score >= 5) return 'Có thể thử, nhưng chưa mạnh'
  return 'Khả năng bán thấp'
}

function scoreTone(score: number) {
  if (score >= 8) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 6.5) return 'text-sky-700 bg-sky-50 border-sky-200'
  if (score >= 5) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-rose-700 bg-rose-50 border-rose-200'
}

function DetailSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Chưa có dữ liệu.</p>
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
}: AiReportModalProps) {
  if (!open) return null

  const text = report || latestReport?.report_markdown || ''
  const structured = useMemo(() => parseStructuredReport(text), [text])

  async function copyReport() {
    if (structured) {
      const lines = [
        `AI report: ${structured.product_summary.idea_name}`,
        `AI hiểu sản phẩm: ${structured.product_summary.detected_product}`,
        `Kết luận nhanh: ${structured.product_summary.quick_verdict}`,
        `Tổng điểm: ${structured.product_summary.overall_score}/10`,
        '',
        ...structured.score_table.map(
          (row) => `${row.criterion}: ${row.score}/10 | trọng số ${row.weight}% | ${row.summary}`,
        ),
      ]
      await navigator.clipboard.writeText(lines.join('\n'))
      return
    }

    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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
              AI đang chấm điểm từng tiêu chí, tính tổng điểm /10 và trả về bảng phân tích. Có thể mất 15–60 giây.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && structured && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI hiểu sản phẩm</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{structured.product_summary.detected_product}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kết luận nhanh</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{structured.product_summary.quick_verdict}</p>
                </div>
                <div
                  className={`rounded-xl border p-4 ${scoreTone(structured.product_summary.overall_score)}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">Tổng điểm</p>
                  <p className="mt-2 text-2xl font-bold">{structured.product_summary.overall_score.toFixed(1)}/10</p>
                  <p className="mt-1 text-xs font-medium">{verdictBand(structured.product_summary.overall_score)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mức tin cậy</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {confidenceLabel(structured.product_summary.confidence)}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Bảng chấm điểm chi tiết</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Chấm theo từng tiêu chí rồi mới tính tổng điểm /10. AI được yêu cầu đánh giá bảo thủ, không nịnh.
                  </p>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-2 text-left">Tiêu chí</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-center">Điểm /10</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-center">Trọng số</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-center">Điểm quy đổi</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left">Nhận xét ngắn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structured.score_table.map((row) => (
                        <tr key={row.criterion} className="align-top odd:bg-white even:bg-slate-50/60">
                          <td className="border-b border-slate-200 px-3 py-2 font-medium text-slate-900">{row.criterion}</td>
                          <td className="border-b border-slate-200 px-3 py-2 text-center">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(row.score)}`}>
                              {row.score.toFixed(1)}
                            </span>
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2 text-center text-slate-700">{row.weight}%</td>
                          <td className="border-b border-slate-200 px-3 py-2 text-center font-medium text-slate-900">
                            {row.weighted_score.toFixed(2)}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2 text-slate-700">{row.summary}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100/80 font-semibold text-slate-900">
                        <td className="px-3 py-2">Tổng</td>
                        <td className="px-3 py-2 text-center">—</td>
                        <td className="px-3 py-2 text-center">100%</td>
                        <td className="px-3 py-2 text-center">{structured.product_summary.overall_score.toFixed(2)}</td>
                        <td className="px-3 py-2">{verdictBand(structured.product_summary.overall_score)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <DetailSection title="Khách hàng mục tiêu" items={structured.details.target_customer} />
                <DetailSection title="Pain point" items={structured.details.pain_point} />
                <DetailSection title="Thị trường / mùa vụ" items={structured.details.market_seasonality} />
                <DetailSection title="USP" items={structured.details.usp} />
                <DetailSection title="Content angle" items={structured.details.content_angle} />
                <DetailSection title="Ads angle" items={structured.details.ads_angle} />
                <DetailSection title="Giá / bundle / upsell" items={structured.details.pricing_bundle_upsell} />
                <DetailSection title="Rủi ro" items={structured.details.risks} />
                <DetailSection title="Next action" items={structured.details.next_action} />
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Giả định & cảnh báo</h3>
                  <div className="mt-3 space-y-3 text-sm text-slate-700">
                    <div>
                      <p className="font-medium text-slate-900">Giả định</p>
                      {structured.product_summary.assumptions.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {structured.product_summary.assumptions.map((item, index) => (
                            <li key={`assumption-${index}`} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-slate-400">Không có giả định đáng kể.</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Red flags</p>
                      {structured.product_summary.red_flags.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {structured.product_summary.red_flags.map((item, index) => (
                            <li key={`flag-${index}`} className="flex gap-2 text-rose-700">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-slate-400">Chưa có cảnh báo đỏ nổi bật.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !structured && text && (
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
