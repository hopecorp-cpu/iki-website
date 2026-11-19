## Luật cho người sửa qua nhóm Web IKI (CEO chốt 19/11/2026, đọc trước khi làm)

Áp cho mọi người và mọi phiên Claude không chạy trên máy CEO (tài khoản GitHub hopecorp-cpu).

- **KHÔNG đẩy thẳng nhánh `main`.** Mỗi việc: tạo nhánh mới từ `origin/main` → sửa → commit → mở PR → gửi link PR cho anh Hưng. Chỉ anh Hưng gộp PR.
- KHÔNG force-push, KHÔNG xoá nhánh/file/kho, KHÔNG commit bí mật (`.env`, khoá API, mật khẩu).
- Chỉ sửa đúng phần được giao; không tự "dọn" code, đổi tên file hay đổi cấu trúc bên cạnh.
- Rào pháp lý sản phẩm: HOPE/IKI là THỰC PHẨM BỔ SUNG, không gọi "thực phẩm chức năng", không so với thuốc. Cấm: chữa, trị, điều trị, khỏi bệnh, thải độc (nghĩa y học), "hiệu quả sau X ngày", khoe kết quả sức khoẻ làm bằng chứng. Khuyến mãi = TẶNG QUÀ, không giảm giá %. Không ghi giá vốn.
- Luật thiết kế: không nền kem/trắng ngà, không chữ nghiêng làm điểm nhấn tiêu đề, không nhãn mục đánh số 01/02/03, không chữ monospace cho nhãn, không nút bo tròn kiểu viên thuốc (bo 4-8px), không emoji làm icon.
- Trong mô tả PR ghi rõ: sửa gì, ở trang nào, đã xem thử trên điện thoại chưa.
- Trang này chạy GitHub Pages: PR được gộp vào `main` là ikihealing.com đổi NGAY sau 1-2 phút. Vì vậy bắt buộc qua PR.

## Luật thiết kế web (CEO 06/10/2026 15:52, bắt buộc)
- Không nền kem/off-white. Ngưỡng nền ấm-sáng: R≥G≥B, độ sáng HSL > 90%, R−B ≥ 6 (kể cả biến CSS, inline, fill SVG nền, chế độ tối). Không miễn huy hiệu trạng thái. Nền dùng #ffffff hoặc xám lạnh rất nhạt. Hồng #f3e8e8 / #f3e4e7 / #FFF4F7 nếu là nền khối thì về #ffffff, giữ viền hoặc vệt hồng; giữ nếu chỉ là chữ/viền. #f3f7f2 (xanh lạnh) được giữ.
- Không in nghiêng chữ nhấn trong h1–h3 (<em>, <i>, font-style:italic). Nhấn bằng font-weight 700 hoặc màu thương hiệu.
- Không nhãn mục đánh số 01/02/03, không dạng «N ·» (1–9 không số 0 đầu), không .sec-num. Bỏ số, giữ tên mục.
- Không font monospace cho nhãn/eyebrow hay chữ SVG <text> (font-mono, ui-monospace, JetBrains/IBM Plex Mono). Chỉ khối code/pre và mã dữ liệu được dùng.
- Không nút pill (border-radius ≥ ½ chiều cao, 999px, rounded-full trên button/a/Link). Nút bo 8px; nhãn/badge 6–8px; nút tròn chỉ có icon thì giữ.
- Trước khi báo xong: chạy `node scripts/kiem-luat-web.mjs` (và scan.py nếu có trong phong-chung/hang-cho-duyet/ra-soat-luat-web-0610/_cong-cu/) → 0 vi phạm, dán kết quả vào PR.
