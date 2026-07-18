const MAX_PRODUCT_TEXT = 1200
const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_FALLBACK_MODEL = 'gpt-4.1-mini'

const MODEL_PROFILES = {
  stable: { label: 'Ổn định / listing nhanh', env: 'OPENAI_MODEL_STABLE', fallback: DEFAULT_FALLBACK_MODEL, webSearch: false },
  cheap: { label: 'Nhẹ / nhiều listing', env: 'OPENAI_MODEL_CHEAP', fallback: DEFAULT_FALLBACK_MODEL, webSearch: false },
  balanced: { label: 'Cân bằng / listing tốt hơn', env: 'OPENAI_MODEL_BALANCED', fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL, webSearch: false },
  strong: { label: 'Mạnh / sản phẩm quan trọng', env: 'OPENAI_MODEL_STRONG', fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL, webSearch: false },
  research: { label: 'Research / có thể đọc web', env: 'OPENAI_MODEL_RESEARCH', fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL, webSearch: false },
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

function cleanOptionalValue(value) {
  if (value === null || value === undefined) return ''
  const text = String(value).trim()
  if (!text) return ''
  const lowered = text.toLowerCase()
  const placeholders = new Set([
    '—', '-', 'n/a', 'na', 'none', 'null', 'undefined',
    '[product_link]', '[additional_information]', '[confirm dimensions]', '[confirm weight]',
    'https://...', 'http://...', 'https://', 'http://',
  ])
  if (placeholders.has(lowered)) return ''
  if (/^https?:\/\/\.{2,}\/?$/i.test(text)) return ''
  if (/^\[.*\]$/.test(text)) return ''
  return text
}

function getCleanIdea(idea) {
  return {
    id: cleanOptionalValue(idea?.id),
    source_idea_id: cleanOptionalValue(idea?.source_idea_id),
    name: cleanOptionalValue(idea?.name),
    niche: cleanOptionalValue(idea?.niche),
    sub_niche: cleanOptionalValue(idea?.sub_niche),
    product_type: cleanOptionalValue(idea?.product_type),
    product_url: cleanOptionalValue(idea?.product_url),
    product_image_url: cleanOptionalValue(idea?.product_image_url),
    product_height: cleanOptionalValue(idea?.product_height),
    product_weight: cleanOptionalValue(idea?.product_weight),
    target_customer: cleanOptionalValue(idea?.target_customer),
    priority: cleanOptionalValue(idea?.priority),
    status: cleanOptionalValue(idea?.status),
    owner: cleanOptionalValue(idea?.owner),
    notes: cleanOptionalValue(idea?.notes),
    saved_at: cleanOptionalValue(idea?.saved_at),
  }
}

function isValidHttpUrl(value) {
  const text = cleanOptionalValue(value)
  if (!text) return false
  try {
    const parsed = new URL(text)
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname && !parsed.hostname.includes('...')
  } catch {
    return false
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
  const cleanUrl = cleanOptionalValue(url)
  if (!isValidHttpUrl(cleanUrl)) return ''

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2500)

  try {
    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 IdeaManagerBot/1.0 (+https://ideamanager.netlify.app)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
    })
    if (!response.ok) return ''
    const contentType = response.headers.get('content-type') || ''
    if (!/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType)) return ''
    const html = await response.text()
    return stripHtml(html).slice(0, MAX_PRODUCT_TEXT)
  } catch {
    return ''
  } finally {
    clearTimeout(timeout)
  }
}

function resolveModelProfile(modelProfile) {
  const key = MODEL_PROFILES[modelProfile] ? modelProfile : 'stable'
  const profile = MODEL_PROFILES[key]
  const model = process.env[profile.env] || profile.fallback || DEFAULT_MODEL
  return { key, label: profile.label, model, webSearch: false }
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

function formatIdeaInfo(idea, productPageText) {
  const rows = [
    ['Tên idea', idea.name],
    ['Niche chính', idea.niche],
    ['Niche con', idea.sub_niche],
    ['Loại sản phẩm', idea.product_type],
    ['Link sản phẩm', idea.product_url],
    ['Ảnh sản phẩm / mockup URL', idea.product_image_url],
    ['Chiều cao sản phẩm', idea.product_height],
    ['Cân nặng sản phẩm', idea.product_weight],
    ['Đối tượng khách hàng', idea.target_customer],
    ['Ghi chú người dùng', idea.notes],
  ]
  const lines = rows.filter(([, value]) => value).map(([key, value]) => `- ${key}: ${value}`)
  if (productPageText) {
    lines.push(`- Nội dung đọc nhanh từ link: ${productPageText}`)
  } else if (idea.product_url) {
    lines.push('- Nội dung đọc từ link: Không đọc được hoặc trang chặn. Vẫn phải viết listing dựa trên tên idea, niche, loại sản phẩm, ảnh URL, chiều cao, cân nặng và ghi chú. Thông tin không chắc phải dùng placeholder hoặc ghi Cần xác nhận.')
  } else {
    lines.push('- Link sản phẩm: Chưa có. Phân tích dựa trên thông tin đã nhập; thông tin thiếu phải dùng placeholder [CONFIRM ...].')
  }
  return lines.join('\n')
}

function buildAmazonListingPrompt(idea, productPageText) {
  const ideaInfo = formatIdeaInfo(idea, productPageText)
  return `Bạn là chuyên gia tối ưu Amazon US listing cho sản phẩm quà tặng, đồ decor, phụ kiện bàn làm việc, fidget toys, cá nhân hóa và sản phẩm in 3D.

NHIỆM VỤ
Viết bộ thông tin listing Amazon US NGẮN GỌN nhưng đủ dùng cho SẢN PHẨM VẬT LÝ ĐÃ ĐƯỢC IN 3D. Không viết listing bán file STL/3MF/file kỹ thuật số.

DỮ LIỆU SẢN PHẨM
${ideaInfo}

QUY TẮC BẮT BUỘC
- Không bịa thông tin. Nếu thiếu dữ liệu, dùng placeholder dạng [CONFIRM DIMENSIONS], [CONFIRM WEIGHT], [CONFIRM COLOR], [CONFIRM COUNTRY OF ORIGIN].
- Vật liệu mặc định của shop là PLA/PETG 3D printed plastic nếu phù hợp, nhưng ghi nhãn [Cần người bán xác nhận] nếu người dùng chưa xác nhận.
- Không dùng claim như best, number one, guaranteed, 100% safe, non-toxic, eco-friendly, unbreakable, official, licensed.
- Không đưa thương hiệu, nhân vật, phim, game, đội thể thao, người nổi tiếng hoặc IP bên thứ ba vào listing nếu chưa có quyền.
- Nếu link/thiết kế có rủi ro IP hoặc license, cảnh báo rõ.
- Listing content viết bằng tiếng Anh tự nhiên cho Amazon US. Phần giải thích/cảnh báo viết bằng tiếng Việt.
- Không trình bày dạng bảng. Trả lời bằng heading và bullet rõ ràng.
- Trả lời vừa đủ, không lan man. Ưu tiên để function chạy ổn định.

PHẦN CẦN TRẢ VỀ

1) QUICK PRODUCT UNDERSTANDING
- AI hiểu sản phẩm là gì:
- Nguồn dữ liệu đã dùng:
- Thông tin còn thiếu cần xác nhận:

2) AMAZON CATEGORY / PRODUCT DETAIL GỢI Ý
- Product Type:
- Main Category:
- Sub Category:
- Item Type Keyword:
- Brand Name: [BRAND NAME]
- Manufacturer: [MANUFACTURER]
- Condition: New
- UPC/GTIN hoặc GTIN Exemption: gợi ý ngắn

3) AMAZON TITLE
Viết 3 title tiếng Anh, 70–150 ký tự, có ghi số ký tự:
1. SEO-focused:
2. Conversion-focused:
3. Safe short:
Chọn title nên dùng nhất và giải thích 1 câu tiếng Việt.

4) ITEM HIGHLIGHT
Viết 1 câu tiếng Anh tối đa 125 ký tự.

5) FIVE BULLET POINTS
Viết 5 bullet points tiếng Anh, mỗi bullet 120–200 ký tự.
Format: SHORT UPPERCASE HEADING – nội dung.
Nếu thiếu kích thước/cân nặng, dùng placeholder.

6) PRODUCT DESCRIPTION
Viết tiếng Anh khoảng 500–800 ký tự. Có nhắc sản phẩm in 3D có thể có layer lines nhẹ và nên tránh nhiệt cao nếu phù hợp.

7) PRODUCT ATTRIBUTES / DETAILS ĐIỀN SẴN
Điền các trường quan trọng nhất:
- Material:
- Primary Material:
- Color:
- Size:
- Style:
- Theme:
- Occasion:
- Special Features:
- Recommended Uses:
- Target Audience:
- Number of Items:
- Included Components:
- Assembly Required:
- Batteries Required:
- Indoor/Outdoor Use:
- Care Instructions:
- Country of Origin:
- Handmade:
- Personalized:

8) DIMENSIONS / WEIGHT / PACKAGE
- Product Dimensions:
- Item Height:
- Item Weight:
- Package Dimensions:
- Package Weight:
- Packaging Type:
Ghi rõ: Người bán phải đo mẫu in thực tế trước khi đăng listing.

9) PRICE & KEYWORDS
- Entry Price:
- Recommended Price:
- Premium Price:
- Primary Keyword:
- 10 Secondary Keywords:
- 10 Long-tail Keywords:
- Backend Search Terms một dòng, dưới khoảng 249 bytes, không dùng brand đối thủ/ASIN/best/cheapest.

10) SAFETY / COMPLIANCE / IP WARNING
- Safety risks cần kiểm tra:
- Main Safety Warning:
- IP/license warning:
- Có nên bán ngay không hay cần kiểm tra thêm:

11) COPY NHANH ĐỂ ĐIỀN AMAZON
Recommended Product Name:
Recommended Amazon Title:
Item Highlight:
Bullet Point 1:
Bullet Point 2:
Bullet Point 3:
Bullet Point 4:
Bullet Point 5:
Product Description:
Material:
Color:
Size:
Product Dimensions:
Item Weight:
Included Components:
Special Features:
Occasion:
Target Audience:
Recommended Price:
Backend Search Terms:
Main Safety Warning:
Main IP or License Warning:`
}

async function callOpenAIOnce({ idea, productPageText, selectedProfile }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY trong Netlify Environment variables.')

  const model = selectedProfile?.model || process.env.OPENAI_MODEL || DEFAULT_MODEL
  const input = [
    {
      role: 'system',
      content: 'Bạn là chuyên gia Amazon listing. Viết đúng yêu cầu, không bịa, trả lời ngắn gọn và đủ dùng.',
    },
    {
      role: 'user',
      content: buildAmazonListingPrompt(idea, productPageText),
    },
  ]

  const body = {
    model,
    input,
    max_output_tokens: 3200,
  }

  if (String(model).startsWith('gpt-5')) {
    body.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
  } else {
    body.temperature = 0.25
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 52000)

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
    if (!text) throw new Error('OpenAI không trả về nội dung listing.')
    return { text, model }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('OpenAI timeout: listing vẫn còn quá dài hoặc model trả lời quá chậm. Hãy thử profile ổn định GPT-4.1 mini hoặc bấm lại.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI({ idea, productPageText, selectedProfile }) {
  const attempts = [selectedProfile]
  const fallbackModel = process.env.OPENAI_MODEL_FALLBACK || DEFAULT_FALLBACK_MODEL
  if (selectedProfile?.model !== fallbackModel) {
    attempts.push({ key: 'fallback', label: 'Fallback ổn định', model: fallbackModel, webSearch: false })
  }

  let lastError = null
  for (const profile of attempts) {
    try {
      return await callOpenAIOnce({ idea, productPageText, selectedProfile: profile })
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const canFallback = /model|does not exist|not found|timeout|rate|429|quota|billing|unsupported/i.test(message)
      if (!canFallback) break
    }
  }
  throw lastError || new Error('Không thể gọi OpenAI.')
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Body phải là JSON hợp lệ.' })
  }

  const { idea, modelProfile } = payload
  if (!idea || typeof idea !== 'object') return json(400, { error: 'Thiếu dữ liệu idea.' })

  const cleanIdea = getCleanIdea(idea)
  const hasAnyReference = Boolean(cleanIdea.name || cleanIdea.product_url || cleanIdea.notes || cleanIdea.product_type || cleanIdea.niche || cleanIdea.sub_niche)
  if (!hasAnyReference) return json(400, { error: 'Cần ít nhất tên idea, link sản phẩm, loại sản phẩm, niche hoặc ghi chú để AI viết listing.' })

  try {
    const productPageText = await fetchProductPageText(cleanIdea.product_url)
    const selectedProfile = resolveModelProfile(modelProfile)
    const result = await callOpenAI({ idea: cleanIdea, productPageText, selectedProfile })

    return json(200, {
      report: result.text,
      reportObject: null,
      score: null,
      model: result.model,
      usedWebSearch: false,
      usedImageInput: false,
      modelProfile: selectedProfile.key,
      modelProfileLabel: selectedProfile.label,
      productPageTextAvailable: Boolean(productPageText),
      analysisType: 'amazon_listing_fast_core',
      warning: productPageText ? '' : 'Không đọc được link hoặc link bị chặn; AI đã viết listing dựa trên dữ liệu idea và placeholder.',
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Không thể viết listing Amazon.' })
  }
}
