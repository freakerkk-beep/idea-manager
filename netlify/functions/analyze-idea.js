const MAX_PRODUCT_TEXT = 7000
const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_FALLBACK_MODEL = 'gpt-4.1-mini'

const AMAZON_LISTING_PROMPT_TEMPLATE = `Bạn là chuyên gia nghiên cứu sản phẩm và tối ưu listing Amazon US, có kinh nghiệm với sản phẩm in 3D, đồ trang trí, quà tặng, phụ kiện bàn làm việc, fidget toys và sản phẩm cá nhân hóa.

NHIỆM VỤ

Phân tích sản phẩm từ đường link được cung cấp, ưu tiên các link từ MakerWorld, sau đó tạo đầy đủ thông tin có thể sử dụng để đăng bán sản phẩm vật lý trên Amazon US.

Link sản phẩm:
[PRODUCT_LINK]

Thông tin bổ sung từ người dùng, nếu có:
[ADDITIONAL_INFORMATION]

QUY TẮC PHÂN TÍCH

1. Hãy truy cập và phân tích toàn bộ thông tin có thể quan sát được từ trang sản phẩm, bao gồm:

* Tên sản phẩm.
* Hình ảnh sản phẩm.
* Mô tả.
* Cấu tạo.
* Chức năng.
* Mục đích sử dụng.
* Phong cách thiết kế.
* Đối tượng khách hàng.
* File hoặc bộ phận đi kèm.
* Vật liệu được đề xuất.
* Thông số in 3D nếu có.
* Kích thước nếu có.
* Thông tin về tác giả hoặc giấy phép sử dụng.

2. Đây là listing bán SẢN PHẨM VẬT LÝ ĐÃ ĐƯỢC IN 3D, không phải listing bán file STL, 3MF hoặc file thiết kế kỹ thuật số.

3. Không được tự ý khẳng định những thông tin không xuất hiện trong nguồn.

4. Với thông tin không có trên trang, có thể đưa ra đề xuất hợp lý nhưng bắt buộc phải ghi một trong các nhãn:

* Xác nhận từ nguồn.
* Suy luận từ hình ảnh.
* Ước tính tham khảo.
* Cần người bán xác nhận.

5. Giá bán, kích thước, trọng lượng, thời gian sản xuất và chi phí chỉ được đưa dưới dạng tham khảo nếu chưa có dữ liệu chính xác.

6. Không sao chép nguyên văn mô tả của tác giả. Hãy viết lại hoàn toàn theo hướng phù hợp với Amazon và tập trung vào lợi ích khách hàng.

7. Không sử dụng các tuyên bố không thể chứng minh như:

* Best.
* Number one.
* Guaranteed.
* 100% safe.
* Non-toxic.
* Eco-friendly.
* Unbreakable.
* Official.
* Licensed.

Chỉ sử dụng khi nguồn cung cấp đủ bằng chứng và người bán xác nhận.

8. Không đưa tên thương hiệu, nhân vật, đội thể thao, bộ phim, trò chơi, người nổi tiếng hoặc tài sản trí tuệ của bên thứ ba vào listing nếu chưa xác nhận quyền sử dụng.

9. Nếu sản phẩm có dấu hiệu liên quan đến bản quyền, nhãn hiệu hoặc thiết kế được bảo hộ, hãy đưa ra cảnh báo rõ ràng.

10. Nếu giấy phép trên MakerWorld không cho phép sử dụng thương mại hoặc không thể xác nhận quyền bán sản phẩm in vật lý, phải ghi:
    “Cần kiểm tra giấy phép thương mại trước khi sản xuất và bán sản phẩm này.”

11. Nếu sản phẩm có bộ phận nhỏ, nam châm, pin, đèn LED, cạnh nhọn, cơ cấu chuyển động hoặc có thể bị xem là đồ chơi trẻ em, phải liệt kê rủi ro tuân thủ và thông tin cần xác minh.

12. Viết listing bằng tiếng Anh tự nhiên, hướng đến khách hàng Mỹ. Phần phân tích và giải thích viết bằng tiếng Việt.

13. Không trình bày kết quả dưới dạng bảng. Trả lời bằng các tiêu đề và đoạn văn rõ ràng.

PHẦN 1 — TÓM TẮT SẢN PHẨM

Tên sản phẩm gốc:

Tên sản phẩm đề xuất bằng tiếng Việt:

Tên sản phẩm đề xuất bằng tiếng Anh:

Sản phẩm này là gì:

Chức năng chính:

Lợi ích chính đối với khách hàng:

Đối tượng khách hàng tiềm năng:

Dịp sử dụng hoặc tặng quà:

Phong cách sản phẩm:

Vấn đề hoặc nhu cầu sản phẩm giải quyết:

Điểm khác biệt có thể khai thác:

PHẦN 2 — MỨC ĐỘ ĐẦY ĐỦ CỦA DỮ LIỆU

Liệt kê riêng:

Thông tin đã xác nhận từ nguồn:

Thông tin suy luận từ hình ảnh:

Thông tin đang được ước tính:

Thông tin người bán cần xác nhận thêm:

Không được bỏ qua phần này.

PHẦN 3 — PHÂN LOẠI AMAZON

Đề xuất:

Amazon Marketplace:
Amazon.com – United States

Product Type:

Danh mục chính:

Danh mục con:

Item Type Keyword đề xuất:

Suggested Browse Node:

Brand Name:
Điền “[BRAND NAME]” nếu chưa được cung cấp.

Manufacturer:
Điền “[MANUFACTURER]” nếu chưa được cung cấp.

Model Name đề xuất:

Model Number đề xuất:

Part Number đề xuất:

Condition:
New

Sản phẩm có cần UPC/GTIN hay không:

Có thể cân nhắc GTIN Exemption hay không:

Giải thích ngắn về lựa chọn Product Type và Category.

PHẦN 4 — CẤU TRÚC BIẾN THỂ

Xác định sản phẩm có phù hợp tạo variation hay không.

Nếu có, đề xuất:

Parent Product Name:

Variation Theme:

Các biến thể màu sắc:

Các biến thể kích thước:

Các biến thể kiểu dáng:

Các biến thể số lượng:

Quy tắc đặt Parent SKU:

Quy tắc đặt Child SKU:

Ví dụ 5 SKU cụ thể:

Không tạo variation giữa những sản phẩm có thiết kế hoặc chức năng hoàn toàn khác nhau.

PHẦN 5 — AMAZON PRODUCT TITLE

Viết 3 tiêu đề Amazon bằng tiếng Anh:

1. Tiêu đề ưu tiên SEO.
2. Tiêu đề ưu tiên dễ đọc và chuyển đổi.
3. Tiêu đề ngắn gọn, an toàn.

Yêu cầu:

* Không nhồi từ khóa.
* Không viết toàn bộ bằng chữ in hoa.
* Không dùng ký hiệu quảng cáo.
* Không đưa giá, giảm giá hoặc thông tin vận chuyển.
* Không đưa tên thương hiệu của bên thứ ba.
* Không dùng từ “handmade” nếu chưa xác nhận quy trình sản xuất.
* Không gọi là “toy” nếu chưa xác định sản phẩm đáp ứng yêu cầu tuân thủ đồ chơi.
* Đặt tên thương hiệu ở đầu tiêu đề dưới dạng “[BRAND NAME]” nếu chưa có brand.
* Ưu tiên tiêu đề rõ ràng, khoảng 70–150 ký tự.
* Ghi số ký tự của từng tiêu đề.

Sau đó chọn một tiêu đề tốt nhất và giải thích ngắn lý do.

PHẦN 6 — ITEM HIGHLIGHT

Viết một Item Highlight bằng tiếng Anh, tối đa 125 ký tự.

Nội dung cần nói nhanh sản phẩm là gì, vật liệu dự kiến và mục đích sử dụng.

Không đưa thông tin chưa xác nhận như một sự thật.

PHẦN 7 — FIVE BULLET POINTS

Viết 5 bullet points bằng tiếng Anh.

Mỗi bullet gồm:

TIÊU ĐỀ VIẾT HOA NGẮN – Nội dung giải thích.

Cấu trúc đề xuất:

Bullet 1: Lợi ích và chức năng chính.

Bullet 2: Thiết kế, cơ chế hoạt động hoặc điểm thú vị.

Bullet 3: Vật liệu, chất lượng hoàn thiện và quy trình sản xuất.

Bullet 4: Kích thước, cách sử dụng, thành phần trong hộp hoặc lưu ý.

Bullet 5: Đối tượng tặng quà, dịp sử dụng và hướng dẫn bảo quản.

Yêu cầu:

* Mỗi bullet khoảng 150–250 ký tự.
* Không lặp lại toàn bộ title.
* Tập trung vào lợi ích thực tế.
* Không đưa cam kết tuyệt đối.
* Khi kích thước chưa xác nhận, sử dụng placeholder như “[CONFIRM DIMENSIONS]”, không tự đưa số ước tính vào bullet chính thức.
* Khi màu sắc có thể khác do quá trình in, có thể thêm lưu ý phù hợp.
* Không gọi sản phẩm là dành cho trẻ em nếu chưa xác nhận tiêu chuẩn an toàn.

PHẦN 8 — PRODUCT DESCRIPTION

Viết một Product Description bằng tiếng Anh dài khoảng 900–1.500 ký tự.

Mô tả cần gồm:

* Giới thiệu sản phẩm.
* Trải nghiệm hoặc lợi ích mang lại.
* Cách sử dụng.
* Phong cách và không gian phù hợp.
* Vật liệu dự kiến.
* Thành phần trong hộp.
* Dịp làm quà.
* Hướng dẫn bảo quản.
* Lưu ý về đặc điểm tự nhiên của sản phẩm in 3D.

Không sử dụng HTML trừ khi được yêu cầu.

PHẦN 9 — PRODUCT ATTRIBUTES

Đề xuất nội dung cho từng trường sau:

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

Unit Count Type:

Included Components:

Assembly Required:

Batteries Required:

Batteries Included:

Indoor or Outdoor Use:

Care Instructions:

Country of Origin:
Điền “[CONFIRM COUNTRY OF ORIGIN]” nếu chưa được cung cấp.

Handmade:
Chỉ chọn Yes khi người bán xác nhận phù hợp.

Personalized:
Chỉ chọn Yes khi sản phẩm thực sự cho phép khách nhập tên, chữ, ảnh hoặc lựa chọn cá nhân.

Đối với mỗi trường, ghi rõ một trong bốn nhãn:

* Xác nhận từ nguồn.
* Suy luận từ hình ảnh.
* Ước tính tham khảo.
* Cần xác nhận.

PHẦN 10 — KÍCH THƯỚC VÀ TRỌNG LƯỢNG THAM KHẢO

Nếu trang nguồn cung cấp kích thước, hãy chuyển đổi sang cả:

* Centimeters.
* Inches.

Nếu trang không cung cấp kích thước, hãy đề xuất ba phương án tham khảo:

Small:

Medium:

Large:

Đối với mỗi phương án, cung cấp:

* Chiều dài.
* Chiều rộng.
* Chiều cao.
* Kích thước bằng cm.
* Kích thước bằng inch.
* Trọng lượng thành phẩm dự kiến bằng gram và ounce.
* Thời gian in dự kiến.
* Lượng filament dự kiến.

Phải ghi rõ:

“Các thông số trên chỉ là ước tính tham khảo từ hình ảnh và loại sản phẩm. Người bán phải đo mẫu in thực tế trước khi đăng listing.”

Đề xuất thêm:

Package Dimensions tham khảo:

Package Weight tham khảo:

Loại hộp hoặc túi đóng gói phù hợp:

Vật liệu bảo vệ khi vận chuyển:

PHẦN 11 — GIÁ BÁN THAM KHẢO

Đề xuất ba mức giá Amazon US:

Entry Price:

Recommended Price:

Premium Price:

Với mỗi mức giá, giải thích:

* Định vị sản phẩm.
* Khách hàng mục tiêu.
* Điều kiện để áp dụng.
* Rủi ro về biên lợi nhuận.

Tạo một công thức giá tham khảo dựa trên:

* Chi phí filament.
* Thời gian chạy máy.
* Chi phí lao động.
* Điện năng và hao mòn máy.
* Bao bì.
* Phí vận chuyển đến kho hoặc khách hàng.
* Amazon referral fee.
* FBA fee hoặc chi phí FBM.
* Chi phí quảng cáo.
* Tỷ lệ lỗi và hàng thay thế.
* Lợi nhuận mục tiêu.

Không được khẳng định đây là giá thị trường thực tế nếu chưa nghiên cứu các listing tương tự trên Amazon.

Đưa ra kết luận:

Khoảng giá bán tham khảo:

Mức giá nên test đầu tiên:

Các chi phí cần xác nhận trước khi chốt giá:

PHẦN 12 — BACKEND SEARCH TERMS

Tạo:

Primary Keyword:

10 Secondary Keywords:

10 Long-tail Keywords:

Backend Search Terms:

Yêu cầu với Backend Search Terms:

* Viết trên một dòng.
* Không dùng dấu phẩy nếu không cần thiết.
* Không lặp lại từ quá nhiều lần.
* Không dùng tên thương hiệu đối thủ.
* Không dùng ASIN.
* Không dùng từ khóa không liên quan.
* Không dùng các từ mang tính quảng cáo như best, cheapest hoặc number one.
* Ưu tiên từ đồng nghĩa, cách gọi khác, công dụng và dịp tặng quà.
* Giữ tổng nội dung ở mức an toàn, không vượt quá khoảng 249 bytes.

PHẦN 13 — PERSONALIZATION

Xác định sản phẩm có thể phát triển thành sản phẩm cá nhân hóa hay không.

Nếu có, đề xuất:

Customization Type:

Tên trường khách hàng cần nhập:

Hướng dẫn nhập thông tin:

Giới hạn ký tự:

Các font đề xuất:

Các lựa chọn màu:

Các vị trí cá nhân hóa:

Thông báo kiểm tra chính tả:

Thông báo về bản xem trước:

Thời gian sản xuất tham khảo:

Mẫu Personalization Instructions bằng tiếng Anh:

Không tự biến sản phẩm thành sản phẩm cá nhân hóa nếu thiết kế không phù hợp.

PHẦN 14 — HƯỚNG DẪN HÌNH ẢNH LISTING

Đề xuất nội dung cho 8 ảnh Amazon:

Ảnh 1 — Main Image:
Mô tả bố cục, góc chụp và sản phẩm xuất hiện.

Ảnh 2 — Key Benefits:

Ảnh 3 — Product Dimensions:

Ảnh 4 — How It Works:

Ảnh 5 — Material and Details:

Ảnh 6 — Lifestyle Use:

Ảnh 7 — Gift Occasion:

Ảnh 8 — What Is Included:

Với từng ảnh, cung cấp:

* Tiêu đề trên ảnh bằng tiếng Anh.
* Nội dung phụ.
* Gợi ý bố cục.
* Những chi tiết phải thể hiện.
* Những thông tin không nên đưa lên ảnh.

Không thay đổi hình dáng, cấu tạo hoặc chi tiết của sản phẩm gốc khi đề xuất mockup. Chỉ được thay đổi background, ánh sáng, bố cục và góc chụp, trừ khi người dùng yêu cầu chỉnh sửa sản phẩm.

PHẦN 15 — A+ CONTENT

Đề xuất cấu trúc A+ Content gồm:

Module 1 — Brand Banner.

Module 2 — Product Story.

Module 3 — Three Main Benefits.

Module 4 — Material and Craftsmanship.

Module 5 — How to Use.

Module 6 — Lifestyle and Gift Occasion.

Module 7 — Comparison Chart.

Với mỗi module, viết:

* Heading bằng tiếng Anh.
* Nội dung ngắn bằng tiếng Anh.
* Loại hình ảnh cần chuẩn bị.
* Mục tiêu chuyển đổi của module.

Không khẳng định thương hiệu có Brand Registry nếu chưa được cung cấp.

PHẦN 16 — SAFETY AND COMPLIANCE

Phân tích sản phẩm có các yếu tố sau hay không:

* Bộ phận nhỏ.
* Nguy cơ hóc.
* Nam châm.
* Pin.
* LED hoặc linh kiện điện.
* Cạnh nhọn.
* Nhiệt.
* Tiếp xúc thực phẩm.
* Tiếp xúc da.
* Dành cho trẻ em.
* Dễ cháy.
* Cơ cấu chuyển động.
* Hóa chất hoặc keo.
* Vật liệu không rõ nguồn gốc.

Đưa ra:

Các cảnh báo có thể cần:

Nhóm tuổi nên cân nhắc:

Tài liệu hoặc kiểm nghiệm có thể cần:

Thông tin người bán phải xác nhận:

Không tự tạo chứng nhận hoặc tuyên bố sản phẩm đạt tiêu chuẩn nếu chưa có tài liệu.

PHẦN 17 — RỦI RO SỞ HỮU TRÍ TUỆ VÀ GIẤY PHÉP

Kiểm tra và nhận xét:

Tên sản phẩm có chứa thương hiệu bên thứ ba không:

Thiết kế có giống nhân vật, logo, đội thể thao, phim, game hoặc người nổi tiếng không:

Giấy phép trên trang nguồn có cho phép sử dụng thương mại không:

Có được phép bán bản in vật lý hay không:

Có cần liên hệ tác giả để xin commercial license không:

Mức độ rủi ro:

* Thấp.
* Trung bình.
* Cao.
* Chưa đủ dữ liệu.

Giải thích rõ lý do.

Không đề xuất bán sản phẩm nếu giấy phép cấm sử dụng thương mại.

PHẦN 18 — THÔNG TIN CẦN NGƯỜI BÁN XÁC NHẬN

Cuối cùng, tạo một danh sách ngắn những thông tin người bán phải bổ sung trước khi đăng listing, ưu tiên:

* Brand.
* Quyền sử dụng thương mại.
* Kích thước thật.
* Trọng lượng thật.
* Vật liệu filament.
* Màu sắc.
* Số lượng sản phẩm trong hộp.
* Phụ kiện đi kèm.
* Quốc gia sản xuất.
* Đối tượng sử dụng.
* Cảnh báo an toàn.
* Giá thành.
* Phương thức fulfillment.
* UPC hoặc GTIN Exemption.
* Thời gian sản xuất.
* Hình ảnh thành phẩm thực tế.

PHẦN 19 — BẢN TÓM TẮT ĐỂ COPY VÀO HỆ THỐNG

Ở cuối câu trả lời, cung cấp một phần tóm tắt ngắn theo đúng thứ tự:

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

Các trường chưa xác nhận phải giữ placeholder dạng “[CONFIRM …]”, không tự điền thông tin giả để làm cho listing trông hoàn chỉnh.`

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

function formatAdditionalInformation(idea, productPageText, imageInputNote) {
  const cleanIdea = getCleanIdea(idea)
  const rows = [
    ['Tên idea', cleanIdea.name],
    ['Niche chính', cleanIdea.niche],
    ['Niche con', cleanIdea.sub_niche],
    ['Loại sản phẩm', cleanIdea.product_type],
    ['Link sản phẩm', cleanIdea.product_url],
    ['Ảnh sản phẩm / mockup URL', cleanIdea.product_image_url],
    ['Chiều cao sản phẩm', cleanIdea.product_height],
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

  filledRows.push('- Lưu ý quan trọng: Tất cả trường bổ sung như ảnh, chiều cao, cân nặng, đối tượng khách hàng và ghi chú đều là tùy chọn. Không được từ chối tạo listing chỉ vì thiếu trường. Nếu thiếu dữ liệu, hãy dùng placeholder [CONFIRM ...] hoặc ghi rõ Cần xác nhận theo quy tắc prompt.')

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

function buildPrompt({ idea, productPageText, imageInputNote }) {
  const cleanIdea = getCleanIdea(idea)
  const productLink = cleanIdea.product_url || '[PRODUCT_LINK]'
  const additionalInformation = formatAdditionalInformation(cleanIdea, productPageText, imageInputNote)

  return AMAZON_LISTING_PROMPT_TEMPLATE
    .replace('[PRODUCT_LINK]', productLink)
    .replace('[ADDITIONAL_INFORMATION]', additionalInformation)
}

async function callOpenAIOnce({ idea, sourceType, productPageText, selectedProfile, useWebSearch, includeImage = true }) {
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
      }),
    },
  ]

  if (imageUrl && includeImage) {
    userContent.push({ type: 'input_image', image_url: imageUrl, detail: 'low' })
  }

  const input = [
    {
      role: 'system',
      content: 'Bạn là chuyên gia nghiên cứu sản phẩm và tối ưu listing Amazon US. Tuân thủ đúng prompt của người dùng, viết listing bằng tiếng Anh và phân tích/giải thích bằng tiếng Việt. Không bịa thông tin.',
    },
    {
      role: 'user',
      content: userContent,
    },
  ]

  const body = { model, input }

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
  const timeout = setTimeout(() => controller.abort(), 60000)

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
    if (error?.name === 'AbortError') throw new Error('OpenAI timeout. Vui lòng thử model ổn định hoặc tắt web search.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI({ idea, sourceType, productPageText, selectedProfile }) {
  const wantsWebSearch = Boolean(selectedProfile?.webSearch)
  const hasImage = isValidHttpUrl(idea?.product_image_url)
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

  const { idea, sourceType = 'idea', modelProfile } = payload
  if (!idea || typeof idea !== 'object') return json(400, { error: 'Thiếu dữ liệu idea.' })

  const cleanIdea = getCleanIdea(idea)
  const hasAnyReference = Boolean(
    cleanIdea.name ||
    cleanIdea.product_url ||
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
    const productPageText = await fetchProductPageText(cleanIdea.product_url)
    const selectedProfile = resolveModelProfile(modelProfile)
    const webSearchAllowed = process.env.OPENAI_ENABLE_WEB_SEARCH === 'true'
    const finalProfile = {
      ...selectedProfile,
      webSearch: Boolean(selectedProfile.webSearch && webSearchAllowed),
    }

    const result = await callOpenAI({ idea: cleanIdea, sourceType, productPageText, selectedProfile: finalProfile })

    return json(200, {
      report: result.text,
      reportObject: null,
      score: null,
      model: result.model,
      usedWebSearch: result.usedWebSearch,
      usedImageInput: result.usedImageInput,
      modelProfile: result.modelProfile,
      modelProfileLabel: result.modelProfileLabel,
      productPageTextAvailable: Boolean(productPageText),
      analysisType: 'amazon_listing',
      warning: result.usedWebSearch ? '' : (finalProfile.webSearch ? 'Đã fallback không dùng web search để tránh lỗi.' : ''),
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Không thể viết listing Amazon.' })
  }
}
