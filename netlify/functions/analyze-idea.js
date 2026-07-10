const MAX_PRODUCT_TEXT = 6000
const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_FALLBACK_MODEL = 'gpt-4.1-mini'

const MODEL_PROFILES = {
  stable: {
    label: 'Ổn định / câu thường',
    env: 'OPENAI_MODEL_STABLE',
    fallback: DEFAULT_FALLBACK_MODEL,
    webSearch: false,
    description: 'Dùng cho câu thường, angle, quyết định. Ưu tiên ổn định và ít lỗi.',
  },
  cheap: {
    label: 'Nhẹ / nhiều idea',
    env: 'OPENAI_MODEL_CHEAP',
    fallback: DEFAULT_FALLBACK_MODEL,
    webSearch: false,
    description: 'Dùng khi muốn chạy số lượng lớn, không cần web search.',
  },
  balanced: {
    label: 'Cân bằng',
    env: 'OPENAI_MODEL_BALANCED',
    fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    webSearch: false,
    description: 'Dùng cho idea quan trọng vừa phải.',
  },
  strong: {
    label: 'Mạnh / idea quan trọng',
    env: 'OPENAI_MODEL_STRONG',
    fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    webSearch: false,
    description: 'Dùng cho idea đã shortlist, cần đánh giá kỹ nhưng chưa cần tìm web.',
  },
  research: {
    label: 'Research thị trường',
    env: 'OPENAI_MODEL_RESEARCH',
    fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    webSearch: true,
    description: 'Dùng riêng cho tìm sản phẩm tương tự. Có web search nếu Netlify bật OPENAI_ENABLE_WEB_SEARCH=true.',
  },
}

const ANALYSIS_TYPES = {
  similar_products: {
    label: 'Tìm sản phẩm tương tự',
    description: 'Tìm/suy luận sản phẩm tương tự trên thị trường US, giá tham khảo, đối thủ và cơ hội khác biệt.',
  },
  angles: {
    label: 'Gợi ý angle',
    description: 'Gợi ý cách làm khác biệt, content angle, ads angle và visual angle.',
  },
  decision: {
    label: 'Đề xuất quyết định',
    description: 'Đưa ra quyết định Nên test / Cần nghiên cứu thêm / Nên bỏ cùng lý do ngắn gọn.',
  },
  // Giữ lại để không lỗi với report/nút cũ, nhưng UI mới không hiển thị nút này nữa.
  quick_score: {
    label: 'Đề xuất quyết định',
    description: 'Đưa ra quyết định ngắn gọn, không dựng bảng điểm nặng.',
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

function resolveModelProfile(modelProfile, analysisType) {
  const requested = typeof modelProfile === 'string' ? modelProfile : ''
  const profileKey = MODEL_PROFILES[requested]
    ? requested
    : (analysisType === 'similar_products' ? 'research' : 'stable')
  const profile = MODEL_PROFILES[profileKey] || MODEL_PROFILES.stable
  const model = process.env[profile.env] || profile.fallback || DEFAULT_MODEL
  return {
    key: profileKey,
    label: profile.label,
    model,
    webSearch: Boolean(profile.webSearch),
    description: profile.description,
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
  const timeout = setTimeout(() => controller.abort(), 5000)

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

function buildPrompt({ idea, sourceType, productPageText, analysisType, useWebSearch, modelProfileLabel }) {
  const tool = ANALYSIS_TYPES[analysisType] || ANALYSIS_TYPES.decision
  const safeType = analysisType === 'quick_score' ? 'decision' : analysisType

  const sharedRules = `
NGUYÊN TẮC BẮT BUỘC:
- Trả lời bằng tiếng Việt.
- Trả lời DẠNG TEXT GỌN, không JSON, không markdown table, không code fence.
- Có thể dùng tiêu đề ngắn và bullet list.
- Không được nịnh. Không viết PR. Không cố làm sản phẩm trông tốt hơn thực tế.
- Nếu idea yếu, USP yếu, rủi ro IP/cạnh tranh cao hoặc khó bán, phải nói thẳng.
- Nếu thiếu dữ liệu, ghi rõ "Giả định" và nói mức tin cậy thấp hơn.
- Ưu tiên đánh giá thực dụng cho team ecommerce / product research.
- Market mặc định: United States / US buyers.
- Dữ liệu đầu vào có thể thiếu; không được bịa số liệu hay bịa link thật.
`

  const similarPrompt = `
NHIỆM VỤ: TÌM SẢN PHẨM TƯƠNG TỰ TRÊN THỊ TRƯỜNG US.

Hãy trả lời theo format text này:

Kết luận nhanh:
- Có/không có dấu hiệu thị trường đã bán sản phẩm tương tự.
- Mức cạnh tranh: Thấp / Trung bình / Cao.
- Có đáng nghiên cứu tiếp không?

Sản phẩm / nhóm sản phẩm tương tự nên kiểm tra:
1. Tên sản phẩm hoặc keyword:
   - Nền tảng nên tìm: Etsy / Amazon / TikTok Shop / MakerWorld / Printables / Shopify / Pinterest
   - Giá tham khảo nếu có cơ sở, nếu không thì ghi "cần kiểm tra".
   - Điểm giống:
   - Điểm khác:
   - Cơ hội khác biệt:
   - Link hoặc keyword tìm kiếm: nếu không chắc link thật thì chỉ ghi keyword, không bịa URL.

Gợi ý keyword để team tự search:
- Etsy: ...
- Amazon: ...
- TikTok Shop: ...
- MakerWorld/Printables nếu liên quan 3D: ...
- Pinterest: ...

Red flags:
- ...

Kết luận cho sếp:
- Nên test / Cần nghiên cứu thêm / Nên bỏ.
- Lý do ngắn gọn.

Ưu tiên nguồn:
1. Etsy cho personalized gift, handmade, decor, POD, custom product.
2. Amazon cho mass-market, phụ kiện phổ thông, review/giá tham khảo.
3. TikTok Shop cho trend/impulse-buy/short video.
4. MakerWorld/Printables cho sản phẩm 3D print.
5. Shopify/DTC stores cho brand nhỏ.
6. Pinterest cho visual trend.

WEB SEARCH: ${useWebSearch ? 'Được phép dùng nếu tool khả dụng.' : 'Không bật web search. Hãy suy luận bảo thủ và đưa keyword để team tự kiểm tra. Tuyệt đối không bịa link.'}
`

  const anglePrompt = `
NHIỆM VỤ: GỢI Ý ANGLE BÁN HÀNG / CONTENT / ADS.

Hãy trả lời theo format text này:

Kết luận nhanh:
- Sản phẩm này nên bán bằng angle nào nhất?
- Angle nào không nên dùng?

Angle đề xuất:
1. Angle:
   - Hook:
   - Visual nên làm:
   - Target customer:
   - Vì sao có thể hiệu quả:
   - Rủi ro:

2. Angle:
   - Hook:
   - Visual nên làm:
   - Target customer:
   - Vì sao có thể hiệu quả:
   - Rủi ro:

Cách làm khác biệt:
- Personalization:
- Bundle:
- Form/design:
- Gift angle:

Next action:
- 3 việc nên làm tiếp theo để test creative.
`

  const decisionPrompt = `
NHIỆM VỤ: ĐỀ XUẤT QUYẾT ĐỊNH CHO SẾP.

Hãy trả lời theo format text này:

Quyết định:
- Chọn một trong ba: Nên test / Cần nghiên cứu thêm / Nên bỏ.

Lý do chính:
- 3-5 bullet, nói thẳng.

Điểm mạnh:
- ...

Điểm yếu / Red flags:
- ...

Điều kiện để được test:
- Nếu cần test, phải đạt điều kiện gì? VD: có USP rõ, margin tốt, tìm được 3 creative angle, tránh IP risk...

Next action:
- Việc tiếp theo cụ thể cho team.

Kết luận một câu:
- Một câu rất ngắn để sếp quyết định nhanh.
`

  const taskPrompt = safeType === 'similar_products'
    ? similarPrompt
    : safeType === 'angles'
      ? anglePrompt
      : decisionPrompt

  return `Bạn là chuyên gia product research, ecommerce growth, creative strategy và market validation cho thị trường US.

CÔNG CỤ ĐANG CHẠY: ${tool.label}
MỤC TIÊU: ${tool.description}
MODEL PROFILE: ${modelProfileLabel || 'Không rõ'}

DỮ LIỆU IDEA:
${JSON.stringify({ sourceType, ...idea }, null, 2)}

NỘI DUNG ĐỌC ĐƯỢC TỪ LINK SẢN PHẨM, NẾU CÓ:
${productPageText || 'Không đọc được hoặc chưa có link sản phẩm.'}

${sharedRules}
${taskPrompt}
`
}

async function callOpenAIOnce({ idea, sourceType, productPageText, analysisType, selectedProfile, useWebSearch }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY trong Netlify Environment variables.')

  const model = selectedProfile?.model || process.env.OPENAI_MODEL || DEFAULT_MODEL
  const input = [
    {
      role: 'system',
      content: 'Bạn là AI analyst nội bộ. Trả lời dạng text gọn, không JSON, không bảng markdown. Đánh giá bảo thủ, không nịnh.',
    },
    {
      role: 'user',
      content: buildPrompt({
        idea,
        sourceType,
        productPageText,
        analysisType,
        useWebSearch,
        modelProfileLabel: selectedProfile?.label,
      }),
    },
  ]

  const body = { model, input }

  if (String(model).startsWith('gpt-5')) {
    body.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
  } else {
    body.temperature = 0.35
  }

  if (useWebSearch) {
    body.tools = [{ type: 'web_search', search_context_size: 'low' }]
    body.tool_choice = 'auto'
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 40000)

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
    return {
      text,
      model,
      usedWebSearch: useWebSearch,
      modelProfile: selectedProfile?.key || '',
      modelProfileLabel: selectedProfile?.label || '',
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('OpenAI timeout. Vui lòng thử lại hoặc tắt web search.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI({ idea, sourceType, productPageText, analysisType, selectedProfile }) {
  const wantsWebSearch = Boolean(selectedProfile?.webSearch)
  const attempts = [
    { profile: selectedProfile, useWebSearch: wantsWebSearch },
    { profile: selectedProfile, useWebSearch: false },
  ]

  if (selectedProfile?.model !== DEFAULT_FALLBACK_MODEL) {
    attempts.push({
      profile: {
        key: 'fallback',
        label: 'Fallback ổn định',
        model: process.env.OPENAI_MODEL_FALLBACK || DEFAULT_FALLBACK_MODEL,
        webSearch: false,
      },
      useWebSearch: false,
    })
  }

  let lastError = null
  for (const attempt of attempts) {
    try {
      return await callOpenAIOnce({
        idea,
        sourceType,
        productPageText,
        analysisType,
        selectedProfile: attempt.profile,
        useWebSearch: attempt.useWebSearch,
      })
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const canFallback = /web_search|tool|unsupported|invalid|model|does not exist|not found|timeout|rate|429|quota|billing/i.test(message)
      if (!canFallback && attempt === attempts[0]) throw error
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

  const { idea, sourceType = 'idea', analysisType = 'decision', modelProfile } = payload
  if (!idea || typeof idea !== 'object') return json(400, { error: 'Thiếu dữ liệu idea.' })
  if (!ANALYSIS_TYPES[analysisType]) return json(400, { error: 'analysisType không hợp lệ.' })

  try {
    const productPageText = await fetchProductPageText(idea.product_url)
    const selectedProfile = resolveModelProfile(modelProfile, analysisType)
    const webSearchAllowed = process.env.OPENAI_ENABLE_WEB_SEARCH === 'true'
    const finalProfile = {
      ...selectedProfile,
      webSearch: Boolean(analysisType === 'similar_products' && selectedProfile.webSearch && webSearchAllowed),
    }

    const result = await callOpenAI({ idea, sourceType, productPageText, analysisType, selectedProfile: finalProfile })

    return json(200, {
      report: result.text,
      reportObject: null,
      score: null,
      model: result.model,
      usedWebSearch: result.usedWebSearch,
      modelProfile: result.modelProfile,
      modelProfileLabel: result.modelProfileLabel,
      productPageTextAvailable: Boolean(productPageText),
      analysisType,
      warning: result.usedWebSearch ? '' : (finalProfile.webSearch ? 'Đã fallback không dùng web search để tránh lỗi.' : ''),
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Không thể phân tích AI.' })
  }
}
