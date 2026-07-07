# Idea Manager – bản không cần mật khẩu

Website quản lý ý tưởng sản phẩm theo niche, xây dựng bằng React, Vite,
TypeScript, Tailwind CSS, Supabase và Netlify.

Bản này **mở trực tiếp Dashboard**, không có trang đăng nhập, không có nút
đăng xuất, không dùng Netlify Function và không cần biến `APP_PASSWORD`.

## Chức năng chính

- Dashboard tổng quan và biểu đồ theo niche.
- Quản lý idea theo từng niche dưới dạng bảng.
- Tìm kiếm và lọc theo niche con, loại sản phẩm, ưu tiên, trạng thái,
  người phụ trách và đánh giá.
- Lưu idea, bỏ lưu, loại bỏ, khôi phục và xóa vĩnh viễn.
- Cài đặt niche, niche con, loại sản phẩm và người phụ trách.
- Dữ liệu dùng chung qua Supabase.
- React Router đã được cấu hình redirect trên Netlify để tải lại trang con
  không bị lỗi 404.

## Biến môi trường cần dùng

Chỉ cần hai biến:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

Không cần `APP_PASSWORD`.

## Tạo database Supabase

1. Vào Supabase → SQL Editor → New query.
2. Chạy toàn bộ file `supabase/schema.sql`.
3. Chạy tiếp file `supabase/seed.sql` nếu muốn thêm dữ liệu mẫu.

## Chạy trên máy

```bash
npm install
cp .env.example .env
# Điền hai biến Supabase vào .env
npm run dev
```

## Deploy lên Netlify

- Branch: `main`
- Base directory: để trống nếu `package.json` nằm ở thư mục gốc repository
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: để trống
- Environment variables: chỉ thêm hai biến Supabase bên trên

Nếu repository cũ vẫn còn thư mục `idea-manager-1` nhưng bản mới được upload
ở thư mục gốc, hãy đổi **Base directory về trống** để Netlify dùng bản mới.

## Cảnh báo bảo mật

File `supabase/schema.sql` hiện cho phép đọc và ghi dữ liệu bằng publishable
key. Vì website không có đăng nhập, bất kỳ ai có URL Netlify đều có thể xem,
thêm, sửa hoặc xóa dữ liệu. Không lưu thông tin bí mật và không chia sẻ URL
công khai. Muốn bảo mật thật sự, nên dùng Supabase Auth và RLS theo người dùng.
