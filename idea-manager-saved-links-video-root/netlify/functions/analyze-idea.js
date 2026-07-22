const MAX_PRODUCT_TEXT = 4500
const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_FALLBACK_MODEL = 'gpt-4.1-mini'

const AMAZON_LISTING_PROMPT_TEMPLATE = `Bạn là chuyên gia nghiên cứu sản phẩm và tối ưu listing Amazon US, có kinh nghiệm với sản phẩm in 3D, đồ trang trí, quà tặng, phụ kiện bàn làm việc, fidget toys và sản phẩm cá nhân hóa.

NHIỆM VỤ
Viết bộ thông tin listing Amazon US cho SẢN PHẨM VẬT LÝ ĐÃ ĐƯỢC IN 3D, dựa trên link sản phẩm và thông tin người dùng cung cấp.
Không viết listing bán file STL, 3MF hoặc file thiết kế kỹ thuật số.

Link sản phẩm:
[PRODUCT_LINK]

Thông tin bổ sung từ người dùng:
[ADDITIONAL_INFORMATION]

QUY TẮC QUAN TRỌNG
1. Ưu tiên phân tích link MakerWorld nếu đọc được. Nếu link không đọc được hoặc trang chặn truy cập, vẫn tiếp tục viết listing dựa trên tên idea, niche, loại sản phẩm, ghi chú, ảnh URL, chiều cao, chiều ngang và cân nặng người dùng nhập.
2. Không được tự ý khẳng định thông tin không có nguồn. Với thông tin chưa chắc, dùng nhãn: [Xác nhận từ nguồn], [Suy luận từ hình ảnh/tên sản phẩm], [Ước tính tham khảo], hoặc [Cần người bán xác nhận].
3. Không copy nguyên văn mô tả của tác giả. Viết lại hoàn toàn theo phong cách Amazon US, tập trung vào lợi ích khách hàng.
4. Không dùng claim không chứng minh được: best, number one, guaranteed, 100% safe, non-toxic, eco-friendly, unbreakable, official, licensed.
5. Không đưa tên thương hiệu, nhân vật, đội thể thao, phim, game, người nổi tiếng hoặc IP bên thứ ba vào title/bullet/keyword nếu chưa xác nhận quyền sử dụng.
6. Nếu có rủi ro IP, bản quyền, trademark hoặc license thương mại, cảnh báo rõ ràng. Nếu không xác nhận được quyền bán bản in vật lý, ghi: “Cần kiểm tra giấy phép thương mại trước khi sản xuất và bán sản phẩm này.”
7. Nếu sản phẩm có bộ phận nhỏ, nam châm, pin, LED, cạnh nhọn, cơ cấu chuyển động, tiếp xúc thực phẩm/da hoặc có thể bị xem là đồ chơi trẻ em, hãy nêu rủi ro cần xác minh.
8. Listing content viết bằng tiếng Anh tự nhiên cho Amazon US. Phần phân tích, cảnh báo và ghi chú viết bằng tiếng Việt.
9. Không trình bày dạng bảng. Trả lời bằng tiêu đề rõ ràng, đoạn ngắn, bullet rõ.
10. Bỏ qua A+ Content và hướng dẫn ảnh listing trong câu trả lời này để output ngắn, ổn định và dễ chạy.

THÔNG TIN MẶC ĐỊNH CHO SẢN PHẨM 3D PRINT CỦA SHOP
Áp dụng khi phù hợp và không mâu thuẫn với nguồn:
- Sản phẩm là finished physical 3D printed product.
- Vật liệu thường dùng: PLA hoặc PETG 3D printed plastic. Nếu chưa biết vật liệu chính, ghi “PLA/PETG 3D printed plastic [Cần người bán xác nhận]”.
- Primary Material: Plastic.
- Finish/Surface: 3D printed finish; có thể có layer lines nhẹ và sai khác màu nhỏ do quá trình in.
- Care Instructions: Wipe gently with a dry or slightly damp cloth; avoid high heat, direct flame, harsh chemicals, dishwasher, and prolonged outdoor exposure unless confirmed.
- Included Components mặc định: 1 finished 3D printed item, trừ khi người dùng cung cấp số lượng/phụ kiện khác.
- Assembly Required: No, trừ khi sản phẩm có bộ phận lắp ráp.
- Batteries Required/Included: No, trừ khi có LED/electronic.
- Indoor/Outdoor Use: Indoor, trừ khi nguồn xác nhận dùng ngoài trời.
- Country of Origin: [CONFIRM COUNTRY OF ORIGIN].
- Brand Name: [BRAND NAME] nếu chưa có brand.
- Manufacturer: [MANUFACTURER] nếu chưa có manufacturer.
- Handmade: [CONFIRM HANDMADE STATUS]. Không tự chọn Yes nếu người bán chưa xác nhận.
- Personalized: Yes chỉ khi sản phẩm thật sự cho phép nhập tên/chữ/ảnh/màu cá nhân hóa; nếu không rõ, ghi [Cần xác nhận].

ĐẦU RA CẦN VIẾT

PHẦN 1 — TÓM TẮT SẢN PHẨM
Tên sản phẩm gốc:
Tên sản phẩm đề xuất bằng tiếng Việt:
Tên sản phẩm đề xuất bằng tiếng Anh:
AI hiểu sản phẩm là gì:
Chức năng chính:
Lợi ích chính với khách hàng:
Đối tượng khách hàng tiềm năng:
Dịp sử dụng/tặng quà:
Phong cách sản phẩm:
Điểm khác biệt có thể khai thác:
Dữ liệu đã dùng: link / ảnh URL / chiều cao / chiều ngang / cân nặng / ghi chú / niche.

PHẦN 2 — MỨC ĐỘ ĐẦY ĐỦ DỮ LIỆU
Thông tin đã xác nhận từ nguồn:
Thông tin suy luận:
Thông tin ước tính:
Thông tin cần người bán xác nhận:

PHẦN 3 — AMAZON CATEGORY & PRODUCT DETAIL GỢI Ý
Amazon Marketplace: Amazon.com – United States
Product Type:
Main Category:
Sub Category:
Item Type Keyword:
Suggested Browse Node:
Brand Name:
Manufacturer:
Model Name:
Model Number:
Part Number:
Condition: New
UPC/GTIN hoặc GTIN Exemption:
Giải thích ngắn:

PHẦN 4 — AMAZON PRODUCT TITLE
Viết 3 title bằng tiếng Anh:
1. SEO-focused title:
2. Conversion-focused title:
3. Safe short title:
Ghi số ký tự cho từng title.
Chọn title tốt nhất và giải thích ngắn.

PHẦN 5 — ITEM HIGHLIGHT
Viết 1 Item Highlight tiếng Anh, tối đa 125 ký tự.

PHẦN 6 — FIVE BULLET POINTS
Viết 5 bullet points tiếng Anh. Mỗi bullet 150–250 ký tự.
Format: SHORT UPPERCASE HEADING – nội dung.
Bullet 1: lợi ích/chức năng chính.
Bullet 2: thiết kế/cơ chế/điểm thú vị.
Bullet 3: vật liệu 3D print/hoàn thiện/quy trình.
Bullet 4: kích thước/cách dùng/thành phần hộp/lưu ý.
Bullet 5: đối tượng quà tặng/dịp dùng/bảo quản.
Nếu thiếu size/weight, dùng placeholder [CONFIRM DIMENSIONS] hoặc [CONFIRM WEIGHT].

PHẦN 7 — PRODUCT DESCRIPTION
Viết Product Description tiếng Anh khoảng 700–1.100 ký tự.
Nội dung gồm: sản phẩm là gì, trải nghiệm/lợi ích, cách dùng, không gian phù hợp, vật liệu PLA/PETG nếu phù hợp, thành phần trong hộp, dịp làm quà, bảo quản, đặc điểm tự nhiên của sản phẩm in 3D.

PHẦN 8 — PRODUCT ATTRIBUTES / PRODUCT DETAILS
Điền gợi ý cho các trường sau, dùng nhãn [Xác nhận từ nguồn], [Suy luận], [Ước tính tham khảo], [Cần xác nhận]:
Brand Name:
Manufacturer:
Model Name:
Model Number:
Part Number:
Material:
Primary Material:
Color:
Color Map:
Size Name:
Style:
Pattern:
Shape:
Theme:
Occasion:
Special Features:
Recommended Uses:
Room Type:
Mounting Type:
Finish Type:
Target Audience:
Age Range Description:
Department:
Number of Items:
Number of Pieces:
Unit Count:
Included Components:
Assembly Required:
Batteries Required:
Batteries Included:
Indoor or Outdoor Use:
Care Instructions:
Country of Origin:
Handmade:
Personalized:

PHẦN 9 — KÍCH THƯỚC, CÂN NẶNG, PACKAGE
Nếu người dùng đã nhập chiều cao, chiều ngang hoặc cân nặng, dùng giá trị đó và ghi nhãn [Người dùng cung cấp].
Nếu thiếu length/width/weight/package, dùng placeholder [CONFIRM ...], không bịa như sự thật.
Product Dimensions:
Item Height:
Item Width:
Item Weight:
Package Dimensions:
Package Weight:
Packaging Type:
Protective Material:
Ghi chú bắt buộc: “Người bán phải đo mẫu in thực tế trước khi đăng listing.”

PHẦN 10 — GIÁ BÁN THAM KHẢO NGẮN
Entry Price:
Recommended Price:
Premium Price:
Mức giá nên test đầu tiên:
Các chi phí cần xác nhận trước khi chốt giá:
Không khẳng định là giá thị trường thực tế nếu chưa research đối thủ.

PHẦN 11 — KEYWORDS & BACKEND SEARCH TERMS
Primary Keyword:
10 Secondary Keywords:
10 Long-tail Keywords:
Backend Search Terms một dòng, dưới khoảng 249 bytes, không dùng brand đối thủ, ASIN, best/cheapest/number one.

PHẦN 12 — PERSONALIZATION
Sản phẩm có phù hợp cá nhân hóa không:
Customization Type:
Customer Input Field:
Character Limit:
Font/Color Suggestions:
Personalization Placement:
Personalization Instructions bằng tiếng Anh:
Nếu không phù hợp, ghi rõ không nên ép cá nhân hóa.

PHẦN 13 — SAFETY, COMPLIANCE, IP/LICENSE
Safety risks cần kiểm tra:
Age group nên cân nhắc:
Warning có thể cần:
Tài liệu/kiểm nghiệm có thể cần:
IP/trademark/license risk:
Có nên bán ngay không hay cần kiểm tra license:

PHẦN 14 — THÔNG TIN CẦN NGƯỜI BÁN XÁC NHẬN
Liệt kê ngắn các thông tin phải bổ sung trước khi đăng: brand, license thương mại, kích thước thật, trọng lượng thật, vật liệu chính PLA/PETG, màu sắc, số lượng, phụ kiện, country of origin, cảnh báo an toàn, giá thành, fulfillment, UPC/GTIN exemption, ảnh thành phẩm thật.

PHẦN 15 — BẢN COPY NHANH ĐỂ ĐIỀN AMAZON
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
Package Dimensions:
Package Weight:
Included Components:
Special Features:
Occasion:
Target Audience:
Recommended Price:
Backend Search Terms:
Main Safety Warning:
Main IP or License Warning:

Các trường chưa xác nhận phải giữ placeholder dạng [CONFIRM ...], không tự điền thông tin giả để làm listing trông hoàn chỉnh.`

const SHOPIFY_LISTING_PROMPT_TEMPLATE = `Bạn là chuyên gia viết listing Shopify cho sản phẩm in 3D bằng nhựa PLA hoặc PETG.

Khi người dùng cung cấp link ảnh trực tiếp, link sản phẩm và một số thông tin cơ bản, hãy phân tích dữ liệu có sẵn và hoàn thiện nội dung listing Shopify. Người dùng không bắt buộc phải cung cấp đầy đủ thông tin.

DỮ LIỆU ĐẦU VÀO
Link sản phẩm:
[PRODUCT_LINK]

Thông tin bổ sung từ người dùng:
[ADDITIONAL_INFORMATION]

QUY TẮC
- Viết listing bằng tiếng Anh tự nhiên, phù hợp thị trường Mỹ, trừ khi người dùng yêu cầu khác.
- Không tạo hoặc đề xuất ảnh.
- Không tự ý thay đổi đặc điểm sản phẩm trong ảnh hoặc trong link.
- Có thể research/tham chiếu thông tin về dòng sản phẩm tương tự để đề xuất dữ liệu còn thiếu, nhưng thông tin suy luận phải đặt trong [ngoặc vuông].
- Mọi thông tin suy luận, ước tính hoặc chỉ mang tính tham khảo phải đặt trong [ngoặc vuông].
- Thông tin người dùng đã cung cấp được viết bình thường, không đặt trong ngoặc.
- Nếu không thể xác định, ghi [Cần người bán xác nhận].
- Không tự tạo barcode, chứng nhận, công dụng an toàn hoặc khả năng chịu nhiệt.
- Viết ngắn gọn, không giải thích dài dòng và không lặp lại thông tin.
- Mặc định sản phẩm chỉ có 1 variant. Không đề xuất thêm variant, màu sắc hoặc kích thước khác.
- Chỉ xuất đúng những trường bên dưới.
- Sản phẩm mặc định là finished physical 3D printed product, không phải file STL/3MF.
- Vật liệu mặc định của shop: PLA hoặc PETG 3D printed plastic. Nếu chưa xác nhận chính xác, ghi [PLA/PETG 3D printed plastic - Cần người bán xác nhận].
- Nếu link hoặc ảnh không đọc được, vẫn viết listing dựa trên tên idea, niche, loại sản phẩm, chiều cao, chiều ngang, cân nặng, ghi chú và các thông tin có sẵn.
- Nếu có chiều cao và chiều ngang, gộp vào trường Dimensions theo dạng Height x Width hoặc H x W. Không thêm trường ngoài mẫu.

HÃY TRẢ KẾT QUẢ THEO MẪU SAU

1. TITLE
Viết 1 tiêu đề Shopify rõ ràng, tự nhiên và có chứa từ khóa chính.

2. DESCRIPTION
Viết mô tả ngắn gọn, sẵn sàng dán vào Shopify, gồm:

Đoạn giới thiệu từ 2–3 câu.

Key Features:
- 3–5 bullet points.

Product Details:
- Material:
- Dimensions:
- Weight:
- Color:
- What’s Included:

Care Instructions:

Important Note hoặc Safety Warning nếu thực sự cần thiết.

Không lặp lại cùng một thông tin ở nhiều phần.

3. CATEGORY
- Shopify Product Category:
- Product Type:

Chọn danh mục gần nhất có sẵn trên Shopify.

4. PRICE
- Price:
- Compare-at Price:
- Cost per Item:

Nếu chưa có dữ liệu, đề xuất mức giá phù hợp và đặt trong [ngoặc vuông]. Không bắt buộc sử dụng Compare-at Price. Nếu không cần, ghi “Leave blank”.

5. INVENTORY
- Track Quantity: Yes
- Quantity: [Cần người bán xác nhận]
- SKU:
- Barcode: Leave blank
- Continue Selling When Out of Stock: No

Tạo một SKU ngắn gọn dựa trên tên sản phẩm và chất liệu.

6. SHIPPING
- Physical Product: Yes
- Product Weight:
- Package Size:
- Country of Origin:
- HS Code:

Nếu chưa có trọng lượng đóng gói, hãy đề xuất mức ước tính hợp lý trong [ngoặc vuông]. HS Code chỉ là đề xuất tham khảo và phải đặt trong [ngoặc vuông].

7. VARIANT
- Default Title
- Number of Variants: 1

Luôn để mặc định một variant duy nhất. Không đề xuất thêm option hoặc variant khác.

8. SEARCH ENGINE LISTING
- Page Title: tối đa khoảng 60 ký tự
- Meta Description: khoảng 140–160 ký tự
- URL Handle:

9. INFORMATION TO CONFIRM
Chỉ liệt kê tối đa 5 thông tin quan trọng nhất mà người bán cần kiểm tra trước khi đăng sản phẩm.

THÔNG TIN NGƯỜI DÙNG CÓ THỂ CUNG CẤP
- Product name
- Material
- Dimensions
- Height
- Width
- Weight
- Color
- Product use
- Included items
- Production cost
- Desired price
- Country of origin
- Other information

Sau khi nhận thông tin hiện có, hãy tạo listing ngay. Không yêu cầu người dùng phải điền đủ các mục và không giải thích quy trình thực hiện.`

const MODEL_PROFILES = {
  stable: {
    label: 'Ổn định / listing nhanh',
    env: 'OPENAI_MODEL_STABLE',
    fallback: DEFAULT_FALLBACK_MODEL,
    webSearch: false,
    description: 'Dùng mặc định để viết listing Amazon nhanh, ít lỗi.',
  },
  cheap: {
    label: 'Nhẹ / nhiều listing',
    env: 'OPENAI_MODEL_CHEAP',
    fallback: DEFAULT_FALLBACK_MODEL,
    webSearch: false,
    description: 'Dùng khi muốn viết nhiều listing liên tục.',
  },
  balanced: {
    label: 'Cân bằng / listing tốt hơn',
    env: 'OPENAI_MODEL_BALANCED',
    fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    webSearch: false,
    description: 'Dùng cho sản phẩm quan trọng vừa phải.',
  },
  strong: {
    label: 'Mạnh / sản phẩm quan trọng',
    env: 'OPENAI_MODEL_STRONG',
    fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    webSearch: false,
    description: 'Dùng khi cần listing kỹ hơn, wording tốt hơn.',
  },
  research: {
    label: 'Research / có thể đọc web',
    env: 'OPENAI_MODEL_RESEARCH',
    fallback: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    webSearch: true,
    description: 'Dùng khi có link sản phẩm và muốn tham chiếu kỹ hơn. Có thể chậm hơn.',
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

function resolveModelProfile(modelProfile) {
  const requested = typeof modelProfile === 'string' ? modelProfile : ''
  const profileKey = MODEL_PROFILES[requested] ? requested : 'stable'
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
  const cleanUrl = cleanOptionalValue(url)
  if (!cleanUrl) return ''

  let parsed
  try {
    parsed = new URL(cleanUrl)
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

function cleanOptionalValue(value) {
  if (value === null || value === undefined) return ''
  const text = String(value).trim()
  if (!text) return ''

  const lowered = text.toLowerCase()
  const placeholderValues = new Set([
    '—',
    '-',
    'n/a',
    'na',
    'none',
    'null',
    'undefined',
    '[product_link]',
    '[additional_information]',
    '[confirm dimensions]',
    '[confirm weight]',
    'https://...',
    'http://...',
    'https://',
    'http://',
  ])

  if (placeholderValues.has(lowered)) return ''
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
    saved_product_url: cleanOptionalValue(idea?.saved_product_url),
    video_url: cleanOptionalValue(idea?.video_url),
    product_image_url: cleanOptionalValue(idea?.product_image_url),
    product_height: cleanOptionalValue(idea?.product_height),
    product_width: cleanOptionalValue(idea?.product_width),
    product_weight: cleanOptionalValue(idea?.product_weight),
    target_customer: cleanOptionalValue(idea?.target_customer),
    priority: cleanOptionalValue(idea?.priority),
    status: cleanOptionalValue(idea?.status),
    owner: cleanOptionalValue(idea?.owner),
    notes: cleanOptionalValue(idea?.notes),
    saved_at: cleanOptionalValue(idea?.saved_at),
  }
}

function formatAdditionalInformation(idea, productPageText, imageInputNote) {
  const cleanIdea = getCleanIdea(idea)
  const rows = [
    ['Tên idea', cleanIdea.name],
    ['Niche chính', cleanIdea.niche],
    ['Niche con', cleanIdea.sub_niche],
    ['Loại sản phẩm', cleanIdea.product_type],
    ['Link sản phẩm tham chiếu', cleanIdea.product_url],
    ['Link sản phẩm đã lưu / link listing', cleanIdea.saved_product_url],
    ['Link video', cleanIdea.video_url],
    ['Ảnh sản phẩm / mockup URL', cleanIdea.product_image_url],
    ['Chiều cao sản phẩm', cleanIdea.product_height],
    ['Chiều ngang sản phẩm', cleanIdea.product_width],
    ['Cân nặng sản phẩm', cleanIdea.product_weight],
    ['Đối tượng khách hàng', cleanIdea.target_customer],
    ['Mức ưu tiên', cleanIdea.priority],
    ['Trạng thái', cleanIdea.status],
    ['Owner', cleanIdea.owner],
    ['Ghi chú người dùng', cleanIdea.notes],
  ]

  const filledRows = rows
    .filter(([, value]) => value !== '')
    .map(([label, value]) => `- ${label}: ${value}`)

  if (productPageText) {
    filledRows.push(`- Nội dung đọc được từ link sản phẩm: ${productPageText}`)
  } else if (cleanIdea.product_url) {
    filledRows.push('- Nội dung đọc được từ link sản phẩm: Đã có link nhưng backend không đọc được trang hoặc trang chặn truy cập. Hãy phân tích dựa trên link, tên idea và thông tin còn lại; các thông tin không chắc chắn phải ghi nhãn Cần xác nhận / Ước tính tham khảo.')
  } else {
    filledRows.push('- Link sản phẩm: Chưa có. Hãy phân tích dựa trên các thông tin người dùng đã nhập; thông tin thiếu phải giữ placeholder hoặc ghi Cần xác nhận.')
  }

  if (imageInputNote) filledRows.push(`- Ghi chú xử lý ảnh: ${imageInputNote}`)

  filledRows.push('- Lưu ý quan trọng: Tất cả trường bổ sung như link sản phẩm đã lưu, link video, ảnh, chiều cao, chiều ngang, cân nặng, đối tượng khách hàng và ghi chú đều là tùy chọn. Không được từ chối tạo listing chỉ vì thiếu trường. Nếu thiếu dữ liệu, hãy dùng placeholder [CONFIRM ...] hoặc ghi rõ Cần xác nhận theo quy tắc prompt.')

  return filledRows.join('\n')
}

function isValidHttpUrl(value) {
  const text = cleanOptionalValue(value)
  if (!text) return false
  try {
    const parsed = new URL(text)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (!parsed.hostname || parsed.hostname.includes('...') || parsed.hostname === '.') return false
    return true
  } catch {
    return false
  }
}

function isLikelyDirectImageUrl(value) {
  if (!isValidHttpUrl(value)) return false
  try {
    const parsed = new URL(cleanOptionalValue(value))
    const pathname = parsed.pathname.toLowerCase()
    return /\.(png|jpe?g|webp|gif)(\?.*)?$/.test(pathname)
  } catch {
    return false
  }
}

function buildPrompt({ idea, productPageText, imageInputNote, analysisType = 'amazon_listing' }) {
  const cleanIdea = getCleanIdea(idea)
  const productLink = cleanIdea.product_url || cleanIdea.saved_product_url || '[PRODUCT_LINK]'
  const additionalInformation = formatAdditionalInformation(cleanIdea, productPageText, imageInputNote)

  const template = analysisType === 'shopify_listing' ? SHOPIFY_LISTING_PROMPT_TEMPLATE : AMAZON_LISTING_PROMPT_TEMPLATE
  return template
    .replace('[PRODUCT_LINK]', productLink)
    .replace('[ADDITIONAL_INFORMATION]', additionalInformation)
}

async function callOpenAIOnce({ idea, sourceType, productPageText, selectedProfile, useWebSearch, includeImage = true, analysisType = 'amazon_listing' }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY trong Netlify Environment variables.')

  const model = selectedProfile?.model || process.env.OPENAI_MODEL || DEFAULT_MODEL
  const imageUrl = isLikelyDirectImageUrl(idea?.product_image_url) ? cleanOptionalValue(idea.product_image_url) : ''
  const imageInputNote = imageUrl
    ? includeImage
      ? 'Đã gửi product_image_url như input ảnh cho model nếu model hỗ trợ vision. Nếu model không xem được ảnh, hãy coi ảnh là URL tham khảo và không khẳng định chi tiết chưa chắc chắn.'
      : 'Ảnh sản phẩm có URL nhưng lần gọi này fallback về text-only, không phân tích trực tiếp ảnh.'
    : ''

  const userContent = [
    {
      type: 'input_text',
      text: buildPrompt({
        idea,
        sourceType,
        productPageText,
        imageInputNote,
        analysisType,
      }),
    },
  ]

  if (imageUrl && includeImage) {
    userContent.push({ type: 'input_image', image_url: imageUrl, detail: 'low' })
  }

  const input = [
    {
      role: 'system',
      content: analysisType === 'shopify_listing' ? 'Bạn là chuyên gia viết listing Shopify cho sản phẩm in 3D PLA/PETG. Tuân thủ đúng prompt, viết ngắn gọn bằng tiếng Anh cho thị trường Mỹ, không bịa thông tin.' : 'Bạn là chuyên gia nghiên cứu sản phẩm và tối ưu listing Amazon US. Tuân thủ đúng prompt của người dùng, viết listing bằng tiếng Anh và phân tích/giải thích bằng tiếng Việt. Không bịa thông tin.',
    },
    {
      role: 'user',
      content: userContent,
    },
  ]

  const body = { model, input, max_output_tokens: analysisType === 'shopify_listing' ? 3200 : 6500 }

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
  const timeout = setTimeout(() => controller.abort(), 42000)

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
    return {
      text,
      model,
      usedWebSearch: useWebSearch,
      usedImageInput: Boolean(imageUrl && includeImage),
      modelProfile: selectedProfile?.key || '',
      modelProfileLabel: selectedProfile?.label || '',
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('OpenAI timeout. Prompt đã được rút gọn, nhưng vẫn quá lâu; hãy thử model ổn định hoặc tắt web search.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI({ idea, sourceType, productPageText, selectedProfile, analysisType = 'amazon_listing' }) {
  const wantsWebSearch = Boolean(selectedProfile?.webSearch)
  const hasImage = analysisType === 'shopify_listing'
  const attempts = [
    { profile: selectedProfile, useWebSearch: wantsWebSearch, includeImage: hasImage },
    { profile: selectedProfile, useWebSearch: wantsWebSearch, includeImage: false },
    { profile: selectedProfile, useWebSearch: false, includeImage: false },
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
      includeImage: false,
    })
  }

  let lastError = null
  for (const attempt of attempts) {
    try {
      return await callOpenAIOnce({
        idea,
        sourceType,
        productPageText,
        selectedProfile: attempt.profile,
        useWebSearch: attempt.useWebSearch,
        includeImage: attempt.includeImage,
        analysisType,
      })
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const canFallback = /web_search|tool|unsupported|invalid|model|does not exist|not found|timeout|rate|429|quota|billing|image|vision|input_image/i.test(message)
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

  const { idea, sourceType = 'idea', modelProfile, analysisType = 'amazon_listing' } = payload
  if (!idea || typeof idea !== 'object') return json(400, { error: 'Thiếu dữ liệu idea.' })
  const validAnalysisTypes = new Set(['amazon_listing', 'shopify_listing'])
  const selectedAnalysisType = validAnalysisTypes.has(analysisType) ? analysisType : 'amazon_listing'

  const cleanIdea = getCleanIdea(idea)
  const hasAnyReference = Boolean(
    cleanIdea.name ||
    cleanIdea.product_url ||
    cleanIdea.saved_product_url ||
    cleanIdea.video_url ||
    cleanIdea.product_image_url ||
    cleanIdea.notes ||
    cleanIdea.product_type ||
    cleanIdea.niche ||
    cleanIdea.sub_niche
  )
  if (!hasAnyReference) {
    return json(400, { error: 'Cần ít nhất tên idea, link sản phẩm hoặc ghi chú để AI có dữ liệu phân tích.' })
  }

  try {
    const productPageText = await fetchProductPageText(cleanIdea.product_url || cleanIdea.saved_product_url)
    const selectedProfile = resolveModelProfile(modelProfile)
    const webSearchAllowed = process.env.OPENAI_ENABLE_WEB_SEARCH === 'true'
    const finalProfile = {
      ...selectedProfile,
      webSearch: Boolean(selectedProfile.webSearch && webSearchAllowed),
    }

    const result = await callOpenAI({ idea: cleanIdea, sourceType, productPageText, selectedProfile: finalProfile, analysisType: selectedAnalysisType })

    const toolLabel = selectedAnalysisType === 'shopify_listing' ? 'Viết listing Shopify' : 'Viết listing Amazon'
    const reportPayload = {
      report_type: selectedAnalysisType,
      tool_label: toolLabel,
      idea_name: cleanIdea.name,
      content: result.text,
      model: result.model,
      model_profile: result.modelProfile,
      product_page_text_available: Boolean(productPageText),
      used_web_search: result.usedWebSearch,
      used_image_input: result.usedImageInput,
      created_by: 'idea-manager-ai-tools',
    }

    return json(200, {
      report: JSON.stringify(reportPayload, null, 2),
      reportObject: reportPayload,
      score: null,
      model: result.model,
      usedWebSearch: result.usedWebSearch,
      usedImageInput: result.usedImageInput,
      modelProfile: result.modelProfile,
      modelProfileLabel: result.modelProfileLabel,
      productPageTextAvailable: Boolean(productPageText),
      analysisType: selectedAnalysisType,
      warning: result.usedWebSearch ? '' : (finalProfile.webSearch ? 'Đã fallback không dùng web search để tránh lỗi.' : ''),
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : selectedAnalysisType === 'shopify_listing' ? 'Không thể viết listing Shopify.' : 'Không thể viết listing Amazon.' })
  }
}
