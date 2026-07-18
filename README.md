# Idea Manager – lưu idea độc lập và vĩnh viễn

Website quản lý ý tưởng sản phẩm theo niche, dùng React, Vite, TypeScript,
Tailwind CSS, Supabase và Netlify. Bản này không có mật khẩu đăng nhập.

## Thay đổi trong bản này

- Danh sách idea có bảng kẻ ô rõ ràng.
- Dropdown hiển thị tên danh mục thay vì UUID.
- Đã bỏ hai cột nút `Lưu idea` và `Xóa` ở cuối từng dòng niche.
- Vẫn lưu hàng loạt bằng checkbox và nút `Lưu các idea đã chọn` phía trên.
- Nút dọn hàng loạt được đổi thành `Dọn các idea đã chọn`.
- Idea được lưu sang bảng `saved_ideas` độc lập.
- Sau khi lưu, bạn có thể dọn/xóa idea gốc trong niche mà bản ở tab
  **Idea đã lưu** vẫn còn nguyên.
- Trong tab **Idea đã lưu**, bản lưu chỉ mất khi bạn chọn và bấm
  `Xóa idea đã lưu`.
- Đã bỏ chức năng `Bỏ lưu` để tránh vô tình làm mất bản lưu.

## Cập nhật database đang dùng

Trước khi deploy code mới, chạy file sau đúng một lần:

```text
supabase/migrate_saved_ideas.sql
```

Cách chạy:

1. Vào đúng project Supabase của website.
2. Mở `SQL Editor` → `New query`.
3. Mở file `supabase/migrate_saved_ideas.sql` trên máy.
4. Copy toàn bộ, dán vào SQL Editor và bấm `Run`.
5. Kết quả cuối sẽ hiện số lượng `saved_ideas_total`.

File migration không xóa dữ liệu. Các idea đã lưu theo cơ chế cũ
(`is_saved = true`) sẽ tự được chuyển sang bảng lưu độc lập.

## Biến môi trường Netlify

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

## Deploy lên Netlify

- Branch: `main`
- Base directory: để trống nếu `package.json` nằm ở thư mục gốc GitHub
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: để trống

Sau khi upload code lên GitHub, Netlify sẽ tự deploy. Chờ `Published`, sau đó
hard refresh website bằng `Command + Shift + R` trên Mac hoặc
`Ctrl + Shift + R` trên Windows.

## Dùng cho project Supabase mới

1. Chạy `supabase/schema.sql`.
2. Chạy `supabase/seed.sql` nếu muốn dữ liệu mẫu.

## Cảnh báo bảo mật

Website không có đăng nhập và RLS hiện cho publishable key đọc/ghi dữ liệu.
Không lưu thông tin bí mật và không chia sẻ link Netlify công khai.

## Cập nhật: thêm option ngay trong dropdown

Chạy `supabase/migrate_inline_catalog_options.sql` trước khi deploy bản code này. Sau đó, trong bảng niche, các dropdown Niche chính, Niche con, Loại sản phẩm và Trạng thái xử lý có thể thêm lựa chọn mới trực tiếp. Dữ liệu mới được đồng bộ với trang Cài đặt danh mục.
