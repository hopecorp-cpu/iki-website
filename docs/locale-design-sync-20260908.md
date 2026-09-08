# Đồng bộ thiết kế Việt – Anh – Nhật, 08/09/2026

## Nguyên nhân

Bản Việt đã được làm mới nhưng /en/ và /ja/ còn dùng giao diện, nội dung và đường dẫn menu cũ. Các bản locale là HTML độc lập, không tự kế thừa thiết kế khi sửa tiếng Việt.

## Đã sửa

- Dùng cấu trúc và asset hiện hành của tiếng Việt cho 7 trang chính ở mỗi ngôn ngữ: trang chủ, Học Viện, cộng đồng, ứng dụng, giới thiệu HOPE, đội ngũ và công nghệ.
- Bổ sung bản dịch Anh/Nhật cho nội dung hiện hành; điều chỉnh typography Nhật và nhãn dài Anh trên mobile.
- Đồng bộ cả 2 shop với bản Việt; giữ 8 inline script của từng bản dịch nguyên vẹn, bao gồm dữ liệu sản phẩm, giá và xử lý đặt hàng.
- Đồng bộ header/footer, menu, logo, màu và nút ngôn ngữ của 190 trang Blog đã có bản dịch. Nội dung chính từng trang được so với backup và giữ nguyên.
- Chuyển ngôn ngữ giữ trang tương ứng. Shop đối chiếu trường `vn` có sẵn để chuyển đúng sản phẩm dù tên đã dịch tạo slug khác.
- Các đường dẫn coming-soon cũ cho Academy/Community/App/About chuyển tới bản dịch vừa tạo.
- Các trang chưa có bản dịch (ví dụ chương trình chi tiết, chính sách) vẫn dẫn tới nội dung Việt và có nhãn VI. Không tự nhận là toàn bộ kho bài đã được dịch.
- Ảnh màn hình ứng dụng là bản thiết kế gốc, chữ trong ảnh vẫn tiếng Việt; tiêu đề và mô tả trên website đã dịch.

## Duy trì

Bản dịch biên tập: `data/locales/website-refresh.tsv`. Chạy `python3 scripts/sync-locale-design.py` để đồng bộ theo template Việt (cần beautifulsoup4). Script giữ phần nội dung Blog và inline script shop ở locale; bảng ánh xạ chữ shop gốc nằm trong `data/locales/shop-source-map.json`. Khi thêm nội dung Việt cần bổ sung dòng dịch tương ứng, không tự gọi dịch vụ dịch bên ngoài.

## Kiểm tra

- Chrome/Playwright: 10 trang x 2 ngôn ngữ x 2 viewport (1440 và 390), menu thật, dropdown thật, modal ảnh app, không tràn ngang và không có lỗi JS.
- Kiểm tra đích menu tồn tại, body text của 190 trang Blog không đổi, bộ inline script của hai shop không đổi.
- Bấm tăng/giảm số lượng ở checkout; không tạo đơn và không thực hiện thanh toán thật.
- Kiểm tra riêng chuyển ngôn ngữ khi đang xem sản phẩm.

Backup bản locale trước sửa: `backups/ikihealing-2026-09-08/locales-before-sync.zip` trong kho HOPE CORP local.
