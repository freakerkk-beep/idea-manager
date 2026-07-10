const MAX_PRODUCT_TEXT = 9000
const DEFAULT_MODEL = 'gpt-5-mini'
const OPENAI_TIMEOUT_MS = 28000
const PRODUCT_FETCH_TIMEOUT_MS = 8000
const RETRY_DELAY_MS = 1200

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

function isAbortError(error) {
  return error instanceof Error && error.name === 'AbortError'
}

function normalizeErrorMessage(error) {
  if (!(error instanceof Error)) return 'Không thể phân tích AI.'
  const message = error.message || 'Không thể phân tích AI.'

  if (/OPENAI_API_KEY/i.test(message)) return 'Thiếu OPENAI_API_KEY trong Netlify Environment Variables.'
  if (/Incorrect API key|invalid api key/i.test(message)) return 'OPENAI_API_KEY không hợp lệ.'
  if (/quota|billing|insufficient_quota|rate limit|429/i.test(message)) return 'OpenAI API đang bị giới hạn hoặc hết quota. Hãy kiểm tra billing.'
  if (/model.*does not exist|unknown model|not found/i.test(message)) return 'Model OpenAI hiện tại không khả dụng với tài khoản này.'
  if (/timed out|timeout|quá lâu/i.test(message)) return 'AI phản hồi quá lâu. Vui lòng thử lại.'
  if (/fetch failed|network|ECONNRESET|ENOTFOUND|socket hang up/i.test(message)) return 'Lỗi mạng khi gọi OpenAI. Vui lòng thử lại.'

  return message
}

function shouldRetry(error) {
  if (isAbortError(error)) return true
  if (!(error instanceof Error)) return false
  return /429|quota|rate limit|5\d\d|fetch failed|network|timeout|timed out|ECONNRESET|socket hang up/i.test(error.message)
}

async function fetchProductPageText(url) {
  if (!url || typeof url !== 'string') return { text: '', warning: null }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return { text: '', warning: 'Link sản phẩm không hợp lệ, AI sẽ phân tích theo tên idea và niche.' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { text: '', warning: 'Link sản phẩm không hợp lệ, AI sẽ phân tích theo tên idea và niche.' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PRODUCT_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 IdeaManagerBot/1.0 (+https://ideamanager.netlify.app)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.includes('text/html')) {
      return { text: '', warning: 'Không đọc được nội dung link sản phẩm, AI sẽ suy luận theo dữ liệu hiện có.' }
    }

    const html = await response.text()
    const text = stripHtml(html).slice(0, MAX_PRODUCT_TEXT)
    if (!text) {
      return { text: '', warning: 'Link sản phẩm không có nội dung đọc được, AI sẽ suy luận theo dữ liệu hiện có.' }
    }
    return { text, warning: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { text: '', warning: 'Link sản phẩm phản hồi quá lâu, AI sẽ bỏ qua link và vẫn phân tích tiếp.' }
    }
    return { text: '', warning: 'Không thể đọc link sản phẩm, AI sẽ phân tích theo tên idea và niche.' }
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
      if (typeof content.output_text === 'string') chunks.push(content.output_text)
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

function buildPrompt({ idea, sourceType, productPageText, productWarning }) {
  return `Phân tích idea sản phẩm ecommerce này bằng tiếng Việt.\n\nDỮ LIỆU IDEA:\n${JSON.stringify({ sourceType, ...idea }, null, 2)}\n\nNỘI DUNG ĐỌC ĐƯỢC TỪ LINK SẢN PHẨM, NẾU CÓ:\n${productPageText || 'Không đọc được hoặc chưa có link sản phẩm.'}\n\nGHI CHÚ VỀ LINK SẢN PHẨM:\n${productWarning || 'Không có.'}\n\nYÊU CẦU OUTPUT:\n- Không yêu cầu người dùng nhập riêng trường “sản phẩm là gì”. Hãy tự nhận diện sản phẩm từ tên idea, link sản phẩm, niche, niche con, loại sản phẩm và ghi chú.\n- Nếu link không đọc được, tự suy luận sản phẩm hợp lý từ dữ liệu còn lại và ghi rõ giả định.\n- Viết dạng Markdown, rõ ý, dễ hành động.\n- Đưa ra nhận định thực tế, không nói chung chung.\n- Nếu dữ liệu thiếu, phải nói thẳng là mức tin cậy thấp/trung bình.\n- Ưu tiên góc nhìn bán hàng US market cho POD, dropship, personalized gift, 3D printed decor nếu phù hợp.\n- Nếu có dùng thông tin thị trường/web search, tóm tắt bằng ngôn ngữ của bạn, không chèn link dài.\n\nFORMAT BẮT BUỘC:\n# AI Report: [Tên idea]\n\n**Điểm tiềm năng:** X/10\n**AI hiểu sản phẩm là:** [tự suy luận ngắn gọn từ idea/link/niche, không hỏi người dùng nhập thêm]\n\n## 1. Khách hàng mục tiêu\n## 2. Pain point\n## 3. Thị trường / mùa vụ\n## 4. USP\n## 5. Content angle\n## 6. Ads angle\n## 7. Giá / bundle / upsell\n## 8. Rủi ro\n## 9. Next action\n`
}

async function requestOpenAI(body, apiKey) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

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

    const report = extractOutputText(data)
    if (!report) throw new Error('OpenAI không trả về nội dung phân tích.')
    return report
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI({ idea, sourceType, productPageText, productWarning, useWebSearch }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY trong Netlify Environment Variables.')

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL
  const input = [
    {
      role: 'system',
      content:
        'Bạn là senior product research strategist và ecommerce growth strategist. Bạn phân tích sản phẩm, thị trường, customer insight, content angle, ads angle và sales strategy cho team R&D. Trả lời tiếng Việt, súc tích, hành động được.',
    },
    {
      role: 'user',
      content: buildPrompt({ idea, sourceType, productPageText, productWarning }),
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

  let lastError = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const report = await requestOpenAI(body, apiKey)
      return { report, model, score: extractScore(report), usedWebSearch: useWebSearch }
    } catch (error) {
      lastError = error
      if (attempt === 0 && shouldRetry(error)) {
        await delay(RETRY_DELAY_MS)
        continue
      }
      break
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Không thể gọi OpenAI.')
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
    const { text: productPageText, warning: productWarning } = await fetchProductPageText(idea.product_url)
    const wantsWebSearch = process.env.OPENAI_ENABLE_WEB_SEARCH !== 'false'

    try {
      const result = await callOpenAI({
        idea,
        sourceType,
        productPageText,
        productWarning,
        useWebSearch: wantsWebSearch,
      })
      return json(200, {
        ...result,
        productPageTextAvailable: Boolean(productPageText),
        warning: productWarning || null,
      })
    } catch (firstError) {
      if (wantsWebSearch) {
        const fallback = await callOpenAI({
          idea,
          sourceType,
          productPageText,
          productWarning,
          useWebSearch: false,
        })
        return json(200, {
          ...fallback,
          productPageTextAvailable: Boolean(productPageText),
          warning: [productWarning, normalizeErrorMessage(firstError)].filter(Boolean).join(' | '),
        })
      }
      throw firstError
    }
  } catch (error) {
    return json(500, { error: normalizeErrorMessage(error) })
  }
}
