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
  regenerateLabel?: string
}

function cleanReportText(text: string) {
  if (!text) return ''

  // Nếu gặp report JSON cũ, chuyển nhẹ sang text để không hiện nguyên object khó đọc.
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      const lines: string[] = []
      if (parsed.tool_label) lines.push(`# ${parsed.tool_label}`)
      if (parsed.idea_name) lines.push(`Idea: ${parsed.idea_name}`)
      if (parsed.detected_product) lines.push(`AI hiểu sản phẩm: ${parsed.detected_product}`)
      if (parsed.quick_verdict) lines.push(`Kết luận nhanh: ${parsed.quick_verdict}`)
      if (parsed.final_decision) lines.push(`Quyết định: ${parsed.final_decision}`)
      if (parsed.confidence) lines.push(`Mức tin cậy: ${parsed.confidence}`)

      if (Array.isArray(parsed.similar_products) && parsed.similar_products.length) {
        lines.push('\nSản phẩm tương tự / đối thủ cần kiểm tra:')
        parsed.similar_products.forEach((item: any, index: number) => {
          lines.push(`${index + 1}. ${item.product_name || item.name || 'Sản phẩm tương tự'}`)
          if (item.platform) lines.push(`   - Nền tảng: ${item.platform}`)
          if (item.price_range) lines.push(`   - Giá: ${item.price_range}`)
          if (item.strength) lines.push(`   - Điểm mạnh: ${item.strength}`)
          if (item.weakness) lines.push(`   - Điểm yếu: ${item.weakness}`)
          if (item.differentiation_chance) lines.push(`   - Cơ hội khác biệt: ${item.differentiation_chance}`)
          if (item.link_or_search_hint) lines.push(`   - Link/keyword: ${item.link_or_search_hint}`)
        })
      }

      if (Array.isArray(parsed.angle_table) && parsed.angle_table.length) {
        lines.push('\nAngle gợi ý:')
        parsed.angle_table.forEach((item: any, index: number) => {
          lines.push(`${index + 1}. ${item.angle_type || 'Angle'}`)
          if (item.hook) lines.push(`   - Hook: ${item.hook}`)
          if (item.visual_idea) lines.push(`   - Visual: ${item.visual_idea}`)
          if (item.why_it_might_work) lines.push(`   - Vì sao có thể hiệu quả: ${item.why_it_might_work}`)
          if (item.risk) lines.push(`   - Rủi ro: ${item.risk}`)
        })
      }

      if (Array.isArray(parsed.decision_table) && parsed.decision_table.length) {
        lines.push('\nĐề xuất quyết định:')
        parsed.decision_table.forEach((item: any) => {
          lines.push(`- ${item.field || 'Mục'}: ${item.value || ''}`)
        })
      }

      if (Array.isArray(parsed.next_actions) && parsed.next_actions.length) {
        lines.push('\nNext action:')
        parsed.next_actions.forEach((item: string) => lines.push(`- ${item}`))
      }

      if (Array.isArray(parsed.assumptions) && parsed.assumptions.length) {
        lines.push('\nGiả định:')
        parsed.assumptions.forEach((item: string) => lines.push(`- ${item}`))
      }

      if (Array.isArray(parsed.red_flags) && parsed.red_flags.length) {
        lines.push('\nRed flags:')
        parsed.red_flags.forEach((item: string) => lines.push(`- ${item}`))
      }

      return lines.filter(Boolean).join('\n')
    }
  } catch {
    // Report mới là text thuần, giữ nguyên.
  }

  return text
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

  const rawText = report || latestReport?.report_markdown || ''
  const text = cleanReportText(rawText)

  async function copyReport() {
    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Amazon listing</h2>
            <p className="mt-1 text-sm text-slate-500">{title}</p>
            {latestReport && !loading && (
              <p className="mt-1 text-xs text-slate-400">
                Report gần nhất: {new Date(latestReport.created_at).toLocaleString('vi-VN')}
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
              AI đang viết nội dung listing Amazon dạng text gọn để dễ copy sang Seller Central.
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
              Chưa có bản listing Amazon cho idea này.
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
              {loading ? 'Đang viết...' : regenerateLabel || (text ? 'Viết lại listing' : 'Viết listing Amazon')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
