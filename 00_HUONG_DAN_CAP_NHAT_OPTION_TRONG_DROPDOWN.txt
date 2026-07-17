CẬP NHẬT: THÊM OPTION NGAY TRONG DROPDOWN

TÍNH NĂNG MỚI
- Trong bảng niche, 4 trường có nút thêm lựa chọn ngay trong dropdown:
  1. Niche chính
  2. Niche con
  3. Loại sản phẩm
  4. Trạng thái xử lý
- Lựa chọn mới được lưu vào Supabase và xuất hiện ngay trong Cài đặt danh mục.
- Trạng thái xử lý giờ được quản lý động trong Cài đặt danh mục.

BƯỚC 1 - CHẠY SQL TRƯỚC
1. Vào Supabase > SQL Editor > New query.
2. Mở file: supabase/migrate_inline_catalog_options.sql
3. Copy toàn bộ, dán vào SQL Editor và bấm Run.
4. File này không xóa dữ liệu cũ.

BƯỚC 2 - UPLOAD CODE LÊN GITHUB
1. Chọn toàn bộ file/thư mục bên trong project này.
2. Upload đè vào THƯ MỤC GỐC repository idea-manager.
3. Không upload nguyên thư mục cha.
4. Commit gợi ý: Add inline catalog options to dropdowns

BƯỚC 3 - CHỜ NETLIFY
- Chờ deploy mới hiện Published.
- Hard refresh:
  Mac: Command + Shift + R
  Windows: Ctrl + Shift + R

LƯU Ý
- Muốn thêm Niche con, phải chọn Niche chính trước.
- “Idea mới” và “Đã loại bỏ” là trạng thái hệ thống, không thể đổi tên/xóa/ẩn.
