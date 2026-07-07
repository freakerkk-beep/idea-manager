# Idea Manager – Quản lý ý tưởng sản phẩm theo niche

Website nội bộ đơn giản để 2 người dùng chung: thu thập, đánh giá, lưu và theo dõi
idea sản phẩm theo từng niche, có dashboard tổng quan.

Công nghệ: React + Vite + TypeScript + Tailwind CSS + Supabase (Free) + Netlify (Free).

---

## 1. Cấu trúc dự án

```text
idea-manager/
  src/
    components/       # Badge, ô nhập liệu inline (cells), ConfirmDialog
    pages/             # Dashboard, NichePage, SavedIdeas, TrashPage, Settings, Login
    layouts/           # AppLayout (sidebar + nội dung)
    hooks/              # useAuth, useAppData (state toàn cục), useToast
    services/          # Gọi Supabase: ideas.ts, catalog.ts
    lib/supabase.ts    # Khởi tạo Supabase client
    types/index.ts     # Kiểu dữ liệu dùng chung
    App.tsx, main.tsx
  netlify/functions/
    login.js           # Kiểm tra mật khẩu chung phía server
  supabase/
    schema.sql          # Tạo bảng + RLS policy
    seed.sql             # Dữ liệu mẫu
  netlify.toml
  .env.example
```

---

## 2. Danh sách chức năng đã hoàn thành

- Đăng nhập bằng mật khẩu chung (qua Netlify Function, không lộ mật khẩu trong bundle).
- Sidebar: Dashboard, Idea đã lưu, danh sách niche (động từ Supabase), Idea đã loại bỏ, Cài đặt danh mục.
- Trang niche dạng bảng giống Google Sheets: thêm, sửa trực tiếp trên ô, chọn nhiều dòng, lưu, xóa.
- Đầy đủ các cột: tên, niche chính, niche con, loại sản phẩm, link sản phẩm (kiểm tra URL hợp lệ + nút mở tab mới), đối tượng khách hàng, mức độ ưu tiên, trạng thái xử lý, người phụ trách, đánh giá, ghi chú, lưu, xóa.
- Tìm kiếm theo tên + bộ lọc theo niche con / loại sản phẩm / ưu tiên / trạng thái / người phụ trách / đánh giá.
- Ba nút đánh giá Oke / Bình thường / Loại bỏ, tự động chuyển "Loại bỏ" sang trạng thái "Đã loại bỏ".
- Chức năng Lưu idea (từng dòng hoặc nhiều dòng), không tạo bản ghi trùng, hiển thị trạng thái "Đã lưu / Chưa lưu".
- Trang Idea đã lưu: xem toàn bộ idea đã lưu từ mọi niche, sửa trực tiếp, bộ lọc, xuất CSV, bỏ lưu, xóa.
- Trang Idea đã loại bỏ: khôi phục hoặc xóa vĩnh viễn (có hộp thoại xác nhận).
- Trang Cài đặt: thêm/sửa/ẩn/xóa niche, niche con, loại sản phẩm, người phụ trách (có kiểm tra không cho xóa nếu đang được idea sử dụng).
- Dashboard: 11 thẻ thống kê (bấm vào thẻ Tổng số / Đã lưu / Đã loại bỏ sẽ chuyển trang), biểu đồ cột idea theo niche (Recharts), danh sách idea theo trạng thái, 10 idea mới lưu gần nhất, danh sách "Idea cần chú ý".
- Toast thông báo khi lưu / cập nhật / xóa / khôi phục thành công hoặc lỗi.
- Dữ liệu lưu trên Supabase (PostgreSQL), 2 người dùng thấy chung dữ liệu, tải lại trang thấy dữ liệu do người kia vừa sửa.
- Header bảng cố định khi cuộn, bảng cuộn ngang được trên các trang niche và Idea đã lưu.
- `netlify.toml` cấu hình build + redirect để React Router không bị lỗi 404 khi tải lại trang con.
- File `schema.sql`, `seed.sql`, `.env.example` đầy đủ.
- Build TypeScript không có lỗi (`npm run build` chạy thành công).

## 3. Phần chưa hoàn thành / giới hạn đã biết

- Dữ liệu không tự đồng bộ real-time giữa 2 máy đang mở cùng lúc (Supabase Realtime chưa bật) — cần **tải lại trang** để thấy thay đổi của người kia, đúng như yêu cầu tối thiểu trong bản mô tả, nhưng chưa "live update" tức thời.
- Chưa có tính năng kéo thả sắp xếp cột hoặc công thức kiểu Excel (được nêu rõ là không cần trong bản mô tả).
- Giao diện chưa được tối ưu sâu cho điện thoại (đúng như bản mô tả yêu cầu ưu tiên desktop/tablet).
- Trang đăng nhập dùng Netlify Function nên khi chạy `npm run dev` thông thường, chức năng đăng nhập sẽ báo lỗi kết nối — cần chạy bằng `netlify dev` (hướng dẫn ở mục 6).

---

## 4. Hướng dẫn tạo Supabase miễn phí

1. Vào https://supabase.com → **Start your project** → đăng nhập bằng GitHub/Google.
2. Bấm **New project**, đặt tên (vd: `idea-manager`), chọn mật khẩu database, chọn region gần Việt Nam (Singapore), gói **Free**.
3. Đợi vài phút để project khởi tạo xong.
4. Vào **Integrations → Data API và Settings → API Keys**, lấy 2 giá trị:
   - `Project URL` → dùng cho `VITE_SUPABASE_URL`
   - `Publishable key` (`sb_publishable_...`) → dùng cho `VITE_SUPABASE_PUBLISHABLE_KEY`

## 5. Hướng dẫn chạy file SQL

1. Trong Supabase Dashboard, vào **SQL Editor → New query**.
2. Dán toàn bộ nội dung file `supabase/schema.sql`, bấm **Run**.
3. Tạo query mới, dán nội dung file `supabase/seed.sql`, bấm **Run** để có dữ liệu mẫu (10 idea + niche/niche con/loại sản phẩm/người phụ trách mẫu).
4. Kiểm tra ở **Table Editor** thấy các bảng: `niches`, `sub_niches`, `product_types`, `assignees`, `ideas`.

## 6. Hướng dẫn chạy trên máy (local)

Cần cài **Node.js 18+** và **npm** trước.

```bash
# 1. Cài thư viện
npm install

# 2. Tạo file .env từ mẫu
cp .env.example .env
# rồi mở .env, điền VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, APP_PASSWORD

# 3. Cài Netlify CLI (một lần, để chạy được cả Netlify Functions ở local)
npm install -g netlify-cli

# 4. Chạy ở chế độ dev (bắt buộc dùng netlify dev để trang đăng nhập hoạt động)
netlify dev
```

Website sẽ chạy tại địa chỉ mà `netlify dev` hiển thị (thường là `http://localhost:8888`).

Nếu chỉ muốn xem giao diện nhanh mà không cần đăng nhập thật, có thể chạy `npm run dev`
nhưng trang Login sẽ không kiểm tra được mật khẩu vì thiếu Netlify Functions.

## 7. Hướng dẫn thêm biến môi trường

**Local:** khai báo trong file `.env` (copy từ `.env.example`), gồm:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `APP_PASSWORD` (mật khẩu chung để đăng nhập)

**Trên Netlify:** vào **Site settings → Environment variables**, thêm đúng 3 biến trên
với giá trị thật (không dùng giá trị mẫu).

## 8. Hướng dẫn đưa code lên GitHub

```bash
git init
git add .
git commit -m "Idea Manager - initial version"
# Tạo repo mới trên GitHub (github.com/new), sau đó:
git remote add origin https://github.com/<ten-tai-khoan>/<ten-repo>.git
git branch -M main
git push -u origin main
```

File `.env` đã được thêm vào `.gitignore` nên sẽ không bị đưa lên GitHub.

## 9. Hướng dẫn deploy miễn phí lên Netlify

1. Vào https://app.netlify.com → **Add new site → Import an existing project**.
2. Kết nối GitHub, chọn repo vừa tạo.
3. Build command: `npm run build`, Publish directory: `dist` (Netlify thường tự nhận từ `netlify.toml`).
4. Trước khi bấm Deploy, vào phần **Environment variables** (hoặc sau khi deploy vào **Site settings → Environment variables**) thêm 3 biến ở mục 7.
5. Bấm **Deploy site**. Sau khi build xong, Netlify cấp một domain dạng `ten-ngau-nhien.netlify.app`.
6. Có thể đổi tên domain miễn phí ở **Site settings → Domain management → Options → Edit site name**.
7. Kiểm tra: mở trang, nhập đúng `APP_PASSWORD` để vào, thử thêm/sửa idea, tải lại một trang con (vd `/settings`) để chắc chắn không bị lỗi 404.

---

## Ghi chú bảo mật

- Supabase `Publishable key` được thiết kế để dùng ở frontend; bảng dữ liệu đã bật Row Level Security
  với policy cho phép đọc/ghi qua anon key vì đây là công cụ nội bộ 2 người dùng, không chứa
  dữ liệu cá nhân nhạy cảm. Nếu sau này cần chặt chẽ hơn, có thể đổi sang xác thực Supabase Auth
  và policy theo `auth.uid()`.
- Mật khẩu đăng nhập (`APP_PASSWORD`) chỉ nằm trong biến môi trường phía Netlify Functions,
  không được đưa vào các biến `VITE_*` nên không bị lộ trong mã nguồn frontend.
