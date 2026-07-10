const MAX_PRODUCT_TEXT = 9000
const DEFAULT_MODEL = 'gpt-5-mini'

const ANALYSIS_TYPES = {
  similar_products: {
    label: 'Tìm sản phẩm tương tự',
    description: 'Tìm/suy luận sản phẩm tương tự trên thị trường, giá tham khảo, điểm mạnh/yếu và mức độ cạnh tranh.',
  },
  quick_score: {
    label: 'Chấm điểm bán hàng',
    description: 'Chấm điểm khả năng bán theo các tiêu chí thực dụng, không nịnh.',
  },
  angles: {
    label: 'Gợi ý angle',
    description: 'Đề xuất cách làm khác biệt, content angle, ads angle và visual angle.',
  },
  decision: {
    label: 'Đề xuất quyết định',
    description: 'Đưa ra quyết định Test / Nghiên cứu thêm / Bỏ cùng lý do ngắn gọn.',
  },
}

const WEIGHTS = {
  'Nhu cầu thị trường': 15,
  'Pain point': 15,
  'Độ khác biệt / USP': 15,
  'Dễ làm content': 10,
  'Dễ chạy ads': 10,
  'Biên lợi nhuận / giá bán': 10,
  'Rủi ro cạnh tranh / IP': 15,
  'Next action rõ ràng': 10,
}

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'report_type',
    'tool_label',
    'idea_name',
    'detected_product',
    'quick_verdict',
    'final_decision',
    'overall_score',
    'confidence',
    'assumptions',
    'red_flags',
    'similar_products',
    'score_table',
    'angle_table',
    'decision_table',
    'detail_sections',
    'next_actions',
  ],
  properties: {
    report_type: { type: 'string', enum: Object.keys(ANALYSIS_TYPES) },
    tool_label: { type: 'string' },
    idea_name: { type: 'string' },
    detected_product: { type: 'string' },
    quick_verdict: { type: 'string' },
    final_decision: { type: 'string', enum: ['Nên test', 'Cần nghiên cứu thêm', 'Nên bỏ'] },
    overall_score: { type: 'number', minimum: 0, maximum: 10 },
    confidence: { type: 'string', enum: ['Thấp', 'Trung bình', 'Cao'] },
    assumptions: { type: 'array', items: { type: 'string' } },
    red_flags: { type: 'array', items: { type: 'string' } },
    similar_products: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['product_name', 'platform', 'price_range', 'strength', 'weakness', 'differentiation_chance', 'link_or_search_hint'],
        properties: {
          product_name: { type: 'string' },
          platform: { type: 'string' },
          price_range: { type: 'string' },
          strength: { type: 'string' },
          weakness: { type: 'string' },
          differentiation_chance: { type: 'string' },
          link_or_search_hint: { type: 'string' },
        },
      },
    },
    score_table: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['criterion', 'score', 'weight', 'weighted_score', 'comment'],
        properties: {
          criterion: { type: 'string' },
          score: { type: 'number', minimum: 0, maximum: 10 },
          weight: { type: 'number', minimum: 0, maximum: 100 },
          weighted_score: { type: 'number' },
          comment: { type: 'string' },
        },
      },
    },
    angle_table: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['angle_type', 'hook', 'visual_idea', 'why_it_might_work', 'risk'],
        properties: {
          angle_type: { type: 'string' },
          hook: { type: 'string' },
          visual_idea: { type: 'string' },
          why_it_might_work: { type: 'string' },
          risk: { type: 'string' },
        },
      },
    },
    decision_table: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['field', 'value'],
        properties: {
          field: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
    detail_sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'bullets'],
        properties: {
          title: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    next_actions: { type: 'array', items: { type: 'string' } },
  },
}

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
  const timeout = setTimeout(() => controller.abort(), 7000)

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

function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function round2(n) {
  if (!Number.isFinite(Number(n))) return 0
  return Math.round(Number(n) * 100) / 100
}

function normalizeScoreTable(scoreTable) {
  const defaults = Object.entries(WEIGHTS).map(([criterion, weight]) => ({
    criterion,
    score: 5,
    weight,
    weighted_score: 5 * (weight / 100),
    comment: 'AI chưa cung cấp nhận xét rõ ràng.',
  }))

  const rows = Array.isArray(scoreTable) && scoreTable.length ? scoreTable : defaults
  return rows.map((row, index) => {
    const criterion = String(row.criterion || defaults[index]?.criterion || `Tiêu chí ${index + 1}`)
    const fallbackWeight = WEIGHTS[criterion] ?? defaults[index]?.weight ?? 10
    const weight = Math.max(0, Math.min(100, Number(row.weight ?? fallbackWeight)))
    const score = Math.max(0, Math.min(10, Number(row.score ?? 5)))
    return {
      criterion,
      score: round2(score),
      weight: round2(weight),
      weighted_score: round2(score * (weight / 100)),
      comment: String(row.comment || 'Chưa có nhận xét.'),
    }
  })
}

function normalizeReport(raw, { idea, analysisType, model, productPageTextAvailable, warning }) {
  const parsed = typeof raw === 'string' ? tryParseJson(raw) : raw
  const tool = ANALYSIS_TYPES[analysisType] || ANALYSIS_TYPES.quick_score
  const safe = parsed && typeof parsed === 'object' ? parsed : {}
  const scoreTable = normalizeScoreTable(safe.score_table)
  const totalFromTable = scoreTable.reduce((sum, row) => sum + Number(row.weighted_score || 0), 0)
  const overallScore = Number.isFinite(Number(safe.overall_score))
    ? Math.max(0, Math.min(10, Number(safe.overall_score)))
    : Math.max(0, Math.min(10, totalFromTable))

  const finalDecision = ['Nên test', 'Cần nghiên cứu thêm', 'Nên bỏ'].includes(safe.final_decision)
    ? safe.final_decision
    : overallScore >= 7 ? 'Nên test' : overallScore >= 5.5 ? 'Cần nghiên cứu thêm' : 'Nên bỏ'

  return {
    report_type: analysisType,
    tool_label: tool.label,
    idea_name: String(safe.idea_name || idea.name || 'Idea chưa có tên'),
    detected_product: String(safe.detected_product || safe.product || 'AI chưa nhận diện được rõ sản phẩm.'),
    quick_verdict: String(safe.quick_verdict || safe.verdict || 'Cần xem chi tiết trước khi quyết định.'),
    final_decision: finalDecision,
    overall_score: round2(overallScore),
    confidence: ['Thấp', 'Trung bình', 'Cao'].includes(safe.confidence) ? safe.confidence : 'Trung bình',
    assumptions: Array.isArray(safe.assumptions) ? safe.assumptions.map(String) : [],
    red_flags: Array.isArray(safe.red_flags) ? safe.red_flags.map(String) : [],
    similar_products: Array.isArray(safe.similar_products) ? safe.similar_products.map((item) => ({
      product_name: String(item.product_name || item.name || ''),
      platform: String(item.platform || ''),
      price_range: String(item.price_range || item.price || ''),
      strength: String(item.strength || ''),
      weakness: String(item.weakness || ''),
      differentiation_chance: String(item.differentiation_chance || item.differentiation || ''),
      link_or_search_hint: String(item.link_or_search_hint || item.link || item.search_hint || ''),
    })) : [],
    score_table: scoreTable,
    angle_table: Array.isArray(safe.angle_table) ? safe.angle_table.map((item) => ({
      angle_type: String(item.angle_type || item.type || ''),
      hook: String(item.hook || ''),
      visual_idea: String(item.visual_idea || item.visual || ''),
      why_it_might_work: String(item.why_it_might_work || item.reason || ''),
      risk: String(item.risk || ''),
    })) : [],
    decision_table: Array.isArray(safe.decision_table) ? safe.decision_table.map((item) => ({
      field: String(item.field || ''),
      value: String(item.value || ''),
    })) : [
      { field: 'Quyết định', value: finalDecision },
      { field: 'Lý do', value: String(safe.quick_verdict || 'Dựa trên điểm tổng và rủi ro chính.') },
      { field: 'Mức ưu tiên đề xuất', value: overallScore >= 7 ? 'Cao' : overallScore >= 5.5 ? 'Trung bình' : 'Thấp' },
    ],
    detail_sections: Array.isArray(safe.detail_sections) ? safe.detail_sections.map((section) => ({
      title: String(section.title || ''),
      bullets: Array.isArray(section.bullets) ? section.bullets.map(String) : [],
    })) : [],
    next_actions: Array.isArray(safe.next_actions) ? safe.next_actions.map(String) : [],
    meta: {
      model,
      product_page_text_available: Boolean(productPageTextAvailable),
      warning: warning || '',
      generated_at: new Date().toISOString(),
    },
  }
}

function buildPrompt({ idea, sourceType, productPageText, analysisType, useWebSearch }) {
  const tool = ANALYSIS_TYPES[analysisType] || ANALYSIS_TYPES.quick_score
  return `Bạn là chuyên gia product research, ecommerce growth, creative strategy và market validation cho thị trường US.

NHIỆM VỤ ĐANG CHẠY: ${tool.label}
MỤC TIÊU: ${tool.description}

DỮ LIỆU IDEA:
${JSON.stringify({ sourceType, ...idea }, null, 2)}

NỘI DUNG ĐỌC ĐƯỢC TỪ LINK SẢN PHẨM, NẾU CÓ:
${productPageText || 'Không đọc được hoặc chưa có link sản phẩm.'}

WEB SEARCH: ${useWebSearch ? 'Có thể dùng web search nếu tool khả dụng.' : 'Không bật web search. Nếu thiếu dữ liệu thị trường, phải ghi rõ là suy luận và giảm confidence.'}

NGUYÊN TẮC BẮT BUỘC:
- Trả về JSON hợp lệ, không markdown, không code fence.
- Không được nịnh. Không viết kiểu PR. Không cố làm sản phẩm trông tốt hơn thực tế.
- Nếu idea yếu, USP yếu, rủi ro IP/cạnh tranh cao hoặc khó bán, phải nói thẳng.
- Nếu thiếu dữ liệu, ghi vào assumptions và hạ confidence/điểm.
- Đánh giá bảo thủ. Sếp cần biết có đáng test không, không cần lời khen.
- Nếu analysis_type là similar_products, ưu tiên trả về bảng similar_products có 5-8 sản phẩm/nhóm sản phẩm tương tự. Nếu không có web search, ghi search hint thay vì bịa link.
- Nếu analysis_type là quick_score, score_table là phần quan trọng nhất.
- Nếu analysis_type là angles, angle_table là phần quan trọng nhất.
- Nếu analysis_type là decision, decision_table và final_decision là phần quan trọng nhất.

TIÊU CHÍ CHẤM ĐIỂM VÀ TRỌNG SỐ:
${Object.entries(WEIGHTS).map(([key, value]) => `- ${key}: ${value}%`).join('\n')}

JSON PHẢI CÓ ĐỦ CÁC FIELD:
report_type, tool_label, idea_name, detected_product, quick_verdict, final_decision, overall_score, confidence, assumptions, red_flags, similar_products, score_table, angle_table, decision_table, detail_sections, next_actions.

report_type bắt buộc là: ${analysisType}
tool_label bắt buộc là: ${tool.label}
final_decision chỉ được là: Nên test / Cần nghiên cứu thêm / Nên bỏ.
confidence chỉ được là: Thấp / Trung bình / Cao.`
}

async function callOpenAIOnce({ idea, sourceType, productPageText, analysisType, useWebSearch, useStructuredOutput }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY trong Netlify Environment variables.')

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL
  const input = [
    {
      role: 'system',
      content:
        'Bạn trả về JSON hợp lệ cho hệ thống nội bộ Idea Manager. Không markdown. Không nịnh. Đánh giá bảo thủ và thực dụng.',
    },
    {
      role: 'user',
      content: buildPrompt({ idea, sourceType, productPageText, analysisType, useWebSearch }),
    },
  ]

  const body = { model, input }

  if (useStructuredOutput) {
    body.text = {
      format: {
        type: 'json_schema',
        name: 'idea_ai_tool_report',
        schema: REPORT_SCHEMA,
        strict: true,
      },
    }
  }

  if (String(model).startsWith('gpt-5')) {
    body.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
  } else {
    body.temperature = 0.25
  }

  if (useWebSearch) {
    body.tools = [{ type: 'web_search', search_context_size: 'low' }]
    body.tool_choice = 'auto'
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
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

    const text = extractOutputText(data)
    if (!text) throw new Error('OpenAI không trả về nội dung phân tích.')
    return { text, model, usedWebSearch: useWebSearch }
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('OpenAI timeout. Vui lòng thử lại hoặc tắt web search.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI({ idea, sourceType, productPageText, analysisType, useWebSearch }) {
  try {
    return await callOpenAIOnce({ idea, sourceType, productPageText, analysisType, useWebSearch, useStructuredOutput: true })
  } catch (firstError) {
    const message = firstError instanceof Error ? firstError.message : String(firstError)

    // Fallback 1: một số account/model có thể chưa hỗ trợ schema hoặc web_search.
    if (useWebSearch || /schema|format|web_search|tool|unsupported|invalid/i.test(message)) {
      try {
        return await callOpenAIOnce({ idea, sourceType, productPageText, analysisType, useWebSearch: false, useStructuredOutput: true })
      } catch (secondError) {
        const secondMessage = secondError instanceof Error ? secondError.message : String(secondError)
        if (/schema|format|unsupported|invalid/i.test(secondMessage)) {
          return await callOpenAIOnce({ idea, sourceType, productPageText, analysisType, useWebSearch: false, useStructuredOutput: false })
        }
        throw secondError
      }
    }

    throw firstError
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

  const { idea, sourceType = 'idea', analysisType = 'quick_score' } = payload
  if (!idea || typeof idea !== 'object') return json(400, { error: 'Thiếu dữ liệu idea.' })
  if (!ANALYSIS_TYPES[analysisType]) return json(400, { error: 'analysisType không hợp lệ.' })

  try {
    const productPageText = await fetchProductPageText(idea.product_url)
    const wantsWebSearch = process.env.OPENAI_ENABLE_WEB_SEARCH === 'true' || analysisType === 'similar_products'

    const result = await callOpenAI({ idea, sourceType, productPageText, analysisType, useWebSearch: wantsWebSearch })
    const reportObject = normalizeReport(result.text, {
      idea,
      analysisType,
      model: result.model,
      productPageTextAvailable: Boolean(productPageText),
      warning: result.usedWebSearch ? '' : (wantsWebSearch ? 'Đã fallback không dùng web search để tránh lỗi.' : ''),
    })

    return json(200, {
      report: JSON.stringify(reportObject),
      reportObject,
      score: Math.round(Number(reportObject.overall_score || 0)),
      model: result.model,
      usedWebSearch: result.usedWebSearch,
      productPageTextAvailable: Boolean(productPageText),
      analysisType,
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Không thể phân tích AI.' })
  }
}
