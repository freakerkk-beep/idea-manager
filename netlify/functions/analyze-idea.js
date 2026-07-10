const MAX_PRODUCT_TEXT = 9000
const DEFAULT_MODEL = 'gpt-5-mini'

const CRITERIA = [
  { key: 'Khách hàng mục tiêu', weight: 10, detailsKey: 'target_customer' },
  { key: 'Pain point', weight: 15, detailsKey: 'pain_point' },
  { key: 'Thị trường / mùa vụ', weight: 10, detailsKey: 'market_seasonality' },
  { key: 'USP', weight: 15, detailsKey: 'usp' },
  { key: 'Content angle', weight: 10, detailsKey: 'content_angle' },
  { key: 'Ads angle', weight: 10, detailsKey: 'ads_angle' },
  { key: 'Giá / bundle / upsell', weight: 10, detailsKey: 'pricing_bundle_upsell' },
  { key: 'Rủi ro', weight: 10, detailsKey: 'risks' },
  { key: 'Next action', weight: 10, detailsKey: 'next_action' },
]

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchProductPageText(url) {
  if (!url || typeof url !== 'string') return ''

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return ''
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return ''

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 IdeaManagerBot/1.0 (+https://ideamanager.netlify.app)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.includes('text/html')) return ''

    const html = await response.text()
    return stripHtml(html).slice(0, MAX_PRODUCT_TEXT)
  } catch {
    return ''
  } finally {
    clearTimeout(timeout)
  }
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim()

  const chunks = []
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') chunks.push(content.text)
      if (typeof content.summary === 'string') chunks.push(content.summary)
    }
  }
  return chunks.join('\n').trim()
}

function cleanList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 8)
}

function clampScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10))
}

function buildPrompt({ idea, sourceType, productPageText }) {
  return `Bạn là chuyên gia product research và ecommerce strategy cho DTC / POD / personalized gifts / dropship.

NHIỆM VỤ:
Phân tích idea này một cách trung thực, bảo thủ và không nịnh. Mục tiêu là giúp người dùng biết sản phẩm có khả năng bán được hay không.

DỮ LIỆU IDEA:
${JSON.stringify({ sourceType, ...idea }, null, 2)}

NỘI DUNG ĐỌC ĐƯỢC TỪ LINK SẢN PHẨM, NẾU CÓ:
${productPageText || 'Không đọc được hoặc chưa có link sản phẩm.'}

QUY TẮC BẮT BUỘC:
- Tuyệt đối không nịnh.
- Không dùng ngôn ngữ PR.
- Nếu dữ liệu yếu hoặc thiếu, phải ghi rõ giả định và giảm điểm tương ứng.
- Nếu sản phẩm khó bán, phải nói thẳng là khó bán.
- Nếu link không đọc được, vẫn phải tự suy luận sản phẩm từ tên idea, niche, niche con, loại sản phẩm, ghi chú.
- Điểm từng tiêu chí theo thang 0-10.
- Tổng điểm cuối phải được tính từ các trọng số.
- Chỉ trả về JSON hợp lệ, không markdown, không prose ngoài JSON.

TRỌNG SỐ:
- Khách hàng mục tiêu: 10
- Pain point: 15
- Thị trường / mùa vụ: 10
- USP: 15
- Content angle: 10
- Ads angle: 10
- Giá / bundle / upsell: 10
- Rủi ro: 10
- Next action: 10

ĐỊNH NGHĨA NGẮN:
- quick_verdict phải rất ngắn, kiểu: "Nên test", "Test có chọn lọc", "Khả năng bán thấp".
- confidence chỉ nhận một trong ba giá trị: low, medium, high.
- red_flags là danh sách các cảnh báo chính.
- summary ở từng tiêu chí chỉ 1 câu ngắn.
- details.* là các bullet cụ thể, ngắn gọn, hành động được.`
}

function buildResponseSchema() {
  return {
    name: 'idea_market_analysis',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        product_summary: {
          type: 'object',
          additionalProperties: false,
          properties: {
            idea_name: { type: 'string' },
            detected_product: { type: 'string' },
            quick_verdict: { type: 'string' },
            overall_score: { type: 'number' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
            assumptions: { type: 'array', items: { type: 'string' } },
            red_flags: { type: 'array', items: { type: 'string' } },
          },
          required: ['idea_name', 'detected_product', 'quick_verdict', 'overall_score', 'confidence', 'assumptions', 'red_flags'],
        },
        score_table: {
          type: 'array',
          minItems: 9,
          maxItems: 9,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              criterion: {
                type: 'string',
                enum: CRITERIA.map((item) => item.key),
              },
              score: { type: 'number' },
              weight: { type: 'number' },
              weighted_score: { type: 'number' },
              summary: { type: 'string' },
            },
            required: ['criterion', 'score', 'weight', 'weighted_score', 'summary'],
          },
        },
        details: {
          type: 'object',
          additionalProperties: false,
          properties: {
            target_customer: { type: 'array', items: { type: 'string' } },
            pain_point: { type: 'array', items: { type: 'string' } },
            market_seasonality: { type: 'array', items: { type: 'string' } },
            usp: { type: 'array', items: { type: 'string' } },
            content_angle: { type: 'array', items: { type: 'string' } },
            ads_angle: { type: 'array', items: { type: 'string' } },
            pricing_bundle_upsell: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } },
            next_action: { type: 'array', items: { type: 'string' } },
          },
          required: [
            'target_customer',
            'pain_point',
            'market_seasonality',
            'usp',
            'content_angle',
            'ads_angle',
            'pricing_bundle_upsell',
            'risks',
            'next_action',
          ],
        },
      },
      required: ['product_summary', 'score_table', 'details'],
    },
  }
}

function normalizeStructuredReport(parsed, fallbackIdeaName) {
  const productSummary = parsed?.product_summary && typeof parsed.product_summary === 'object' ? parsed.product_summary : {}
  const details = parsed?.details && typeof parsed.details === 'object' ? parsed.details : {}
  const scoreMap = new Map(
    Array.isArray(parsed?.score_table)
      ? parsed.score_table
          .filter((row) => row && typeof row === 'object' && typeof row.criterion === 'string')
          .map((row) => [String(row.criterion), row])
      : [],
  )

  const normalizedTable = CRITERIA.map((criterion) => {
    const row = scoreMap.get(criterion.key) || {}
    const score = clampScore(row.score)
    const weight = criterion.weight
    const weighted = Number.isFinite(Number(row.weighted_score))
      ? Math.max(0, Math.min(10, Number(row.weighted_score)))
      : Math.round((score * weight) / 100 * 100) / 100

    return {
      criterion: criterion.key,
      score,
      weight,
      weighted_score: Math.round(weighted * 100) / 100,
      summary: typeof row.summary === 'string' && row.summary.trim() ? row.summary.trim() : 'Chưa có nhận xét cụ thể.',
    }
  })

  const totalFromTable = Math.round(normalizedTable.reduce((sum, row) => sum + row.weighted_score, 0) * 100) / 100
  const overallScore = clampScore(productSummary.overall_score || totalFromTable)

  return {
    product_summary: {
      idea_name:
        typeof productSummary.idea_name === 'string' && productSummary.idea_name.trim()
          ? productSummary.idea_name.trim()
          : fallbackIdeaName,
      detected_product:
        typeof productSummary.detected_product === 'string' && productSummary.detected_product.trim()
          ? productSummary.detected_product.trim()
          : 'AI chưa suy luận rõ sản phẩm.',
      quick_verdict:
        typeof productSummary.quick_verdict === 'string' && productSummary.quick_verdict.trim()
          ? productSummary.quick_verdict.trim()
          : 'Cần xem lại dữ liệu trước khi quyết định.',
      overall_score: overallScore,
      confidence: ['low', 'medium', 'high'].includes(productSummary.confidence)
        ? productSummary.confidence
        : 'medium',
      assumptions: cleanList(productSummary.assumptions),
      red_flags: cleanList(productSummary.red_flags),
    },
    score_table: normalizedTable,
    details: {
      target_customer: cleanList(details.target_customer),
      pain_point: cleanList(details.pain_point),
      market_seasonality: cleanList(details.market_seasonality),
      usp: cleanList(details.usp),
      content_angle: cleanList(details.content_angle),
      ads_angle: cleanList(details.ads_angle),
      pricing_bundle_upsell: cleanList(details.pricing_bundle_upsell),
      risks: cleanList(details.risks),
      next_action: cleanList(details.next_action),
    },
  }
}

function verdictBand(score) {
  if (score >= 8) return 'Rất đáng ưu tiên'
  if (score >= 6.5) return 'Có tiềm năng, nên test'
  if (score >= 5) return 'Có thể thử, nhưng chưa mạnh'
  return 'Khả năng bán thấp'
}

async function callOpenAI({ idea, sourceType, productPageText, useWebSearch }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY trong Netlify Environment variables.')

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL
  const input = [
    {
      role: 'system',
      content:
        'Bạn là senior product research strategist và ecommerce growth strategist. Bạn đánh giá sản phẩm, thị trường, content angle, ads angle và khả năng bán hàng một cách trung thực, bảo thủ, không nịnh.',
    },
    {
      role: 'user',
      content: buildPrompt({ idea, sourceType, productPageText }),
    },
  ]

  const body = {
    model,
    input,
    text: {
      format: {
        type: 'json_schema',
        ...buildResponseSchema(),
      },
    },
  }

  if (String(model).startsWith('gpt-5')) {
    body.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
  } else {
    body.temperature = 0.2
  }

  if (useWebSearch) {
    body.tools = [{ type: 'web_search', search_context_size: 'low' }]
    body.tool_choice = 'auto'
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI API lỗi HTTP ${response.status}`
    throw new Error(message)
  }

  const raw = extractOutputText(data)
  if (!raw) throw new Error('OpenAI không trả về nội dung phân tích.')

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('OpenAI trả về dữ liệu không đúng định dạng JSON.')
  }

  const structured = normalizeStructuredReport(parsed, idea.name || 'Idea chưa đặt tên')

  return {
    report: JSON.stringify(structured),
    score: structured.product_summary.overall_score,
    model,
    usedWebSearch: useWebSearch,
    productPageTextAvailable: Boolean(productPageText),
    verdict: verdictBand(structured.product_summary.overall_score),
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Body phải là JSON hợp lệ.' })
  }

  const { idea, sourceType = 'idea' } = payload
  if (!idea || typeof idea !== 'object') return json(400, { error: 'Thiếu dữ liệu idea.' })

  try {
    const productPageText = await fetchProductPageText(idea.product_url)
    const wantsWebSearch = process.env.OPENAI_ENABLE_WEB_SEARCH !== 'false'

    try {
      const result = await callOpenAI({ idea, sourceType, productPageText, useWebSearch: wantsWebSearch })
      return json(200, result)
    } catch (firstError) {
      if (wantsWebSearch) {
        const fallback = await callOpenAI({ idea, sourceType, productPageText, useWebSearch: false })
        return json(200, {
          ...fallback,
          warning: firstError instanceof Error ? firstError.message : 'Web search fallback',
        })
      }
      throw firstError
    }
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Không thể phân tích AI.' })
  }
}
