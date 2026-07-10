const MAX_PRODUCT_TEXT = 9000
const DEFAULT_MODEL = 'gpt-5-mini'

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

function extractScore(text) {
  const patterns = [
    /điểm\s*tiềm\s*năng\s*[:：-]?\s*(\d{1,2})\s*\/\s*10/i,
    /potential\s*score\s*[:：-]?\s*(\d{1,2})\s*\/\s*10/i,
    /score\s*[:：-]?\s*(\d{1,2})\s*\/\s*10/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const score = Number(match[1])
      if (Number.isFinite(score)) return Math.max(0, Math.min(10, score))
    }
  }
  return null
}

function buildPrompt({ idea, sourceType, productPageText }) {
  return `Phân tích idea sản phẩm ecommerce này bằng tiếng Việt.\n\nDỮ LIỆU IDEA:\n${JSON.stringify({ sourceType, ...idea }, null, 2)}\n\nNỘI DUNG ĐỌC ĐƯỢC TỪ LINK SẢN PHẨM, NẾU CÓ:\n${productPageText || 'Không đọc được hoặc chưa có link sản phẩm.'}\n\nYÊU CẦU OUTPUT:\n- Không yêu cầu người dùng nhập riêng trường “sản phẩm là gì”. Hãy tự nhận diện sản phẩm từ tên idea, link sản phẩm, niche, niche con, loại sản phẩm và ghi chú.\n- Nếu link không đọc được, tự suy luận sản phẩm hợp lý từ dữ liệu còn lại và ghi rõ giả định.\n- Viết dạng Markdown, rõ ý, dễ hành động.\n- Đưa ra nhận định thực tế, không nói chung chung.\n- Ưu tiên góc nhìn bán hàng US market cho POD, dropship, personalized gift, 3D printed decor nếu phù hợp.\n- Nếu có dùng thông tin thị trường/web search, tóm tắt bằng ngôn ngữ của bạn, không chèn link dài.\n\nFORMAT BẮT BUỘC:
# AI Report: [Tên idea]

**Điểm tiềm năng:** X/10
**AI hiểu sản phẩm là:** [tự suy luận ngắn gọn từ idea/link/niche, không hỏi người dùng nhập thêm]

## 1. Khách hàng mục tiêu
## 2. Pain point
## 3. Thị trường / mùa vụ
## 4. USP
## 5. Content angle
## 6. Ads angle
## 7. Giá / bundle / upsell
## 8. Rủi ro
## 9. Next action
`
}

async function callOpenAI({ idea, sourceType, productPageText, useWebSearch }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY trong Netlify Environment variables.')

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL
  const input = [
    {
      role: 'system',
      content:
        'Bạn là senior product research strategist và ecommerce growth strategist. Bạn phân tích sản phẩm, thị trường, customer insight, content angle, ads angle và sales strategy cho team R&D. Trả lời tiếng Việt, súc tích, hành động được.',
    },
    {
      role: 'user',
      content: buildPrompt({ idea, sourceType, productPageText }),
    },
  ]

  const body = {
    model,
    input,
  }

  if (String(model).startsWith('gpt-5')) {
    body.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
  } else {
    body.temperature = 0.35
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

  const report = extractOutputText(data)
  if (!report) throw new Error('OpenAI không trả về nội dung phân tích.')

  return { report, model, score: extractScore(report), usedWebSearch: useWebSearch }
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
      return json(200, { ...result, productPageTextAvailable: Boolean(productPageText) })
    } catch (firstError) {
      // Nếu web_search chưa được bật/hỗ trợ ở tài khoản, tự fallback sang gọi model thường.
      if (wantsWebSearch) {
        const fallback = await callOpenAI({ idea, sourceType, productPageText, useWebSearch: false })
        return json(200, {
          ...fallback,
          productPageTextAvailable: Boolean(productPageText),
          warning: firstError instanceof Error ? firstError.message : 'Web search fallback',
        })
      }
      throw firstError
    }
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Không thể phân tích AI.' })
  }
}
