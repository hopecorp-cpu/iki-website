# IKI Beauty & Wellness — đồng bộ định vị, 14/09/2026

Định vị do anh Hưng xác nhận: hệ sinh thái Health Care / HealthTech chăm sóc sức khỏe chủ động cho phụ nữ và gia đình thuộc HOPE CORP. Kết nối kiến thức, Học Viện, công nghệ hỗ trợ cá nhân hóa, cộng đồng và sản phẩm. Chăm da là một ngách trong dinh dưỡng, nghỉ ngơi, vận động, sắc đẹp và sức khỏe gia đình.

## Nguồn định vị cũ đã xác nhận
- `llms.txt` và `scripts/build-structure.mjs` vẫn dùng AI + dữ liệu + Y học Cổ truyền làm định nghĩa toàn thương hiệu.
- Dữ liệu Organization / Person trên trang chủ, đội ngũ và blog giữ mô tả cũ; sameAs còn gom hồ sơ cũ và ứng dụng cũ thành thương hiệu hiện tại.
- Khối giới thiệu lặp ở blog vẫn quảng bá AI Coach Đông y và phân tích theo thể tạng.
- Bốn bài giới thiệu thiết kế app trước đây chưa tách rõ thông tin hiện tại. Đã thêm ghi chú; hai bản dịch của bài cá nhân hóa có ghi chú tương ứng.
- Kết quả tìm kiếm còn hiển thị bản cũ của trang chủ / ứng dụng / đội ngũ. LinkedIn vẫn được lập chỉ mục với AI + Dữ liệu + Đông Y: https://www.linkedin.com/company/ikihealing

Chưa có đường dẫn câu trả lời hoặc nguồn trích của Grok, nên chưa thể kết luận Grok đã dùng chính xác trang nào.

## Đã xử lý trong website
- Trang chủ / giới thiệu / tên app: đồng bộ VI, EN, JA; giữ bố cục đã duyệt.
- Giới thiệu hiện tại: https://ikihealing.com/ve-hope.html#dinh-vi-iki
- Chuẩn hóa dữ liệu Organization và liên kết Facebook, YouTube chính; không coi các trang sản phẩm hay ứng dụng cũ là cùng một thực thể thương hiệu.
- Sửa nguồn sinh llms.txt, mẫu blog và mẫu tài liệu; bước chuẩn hóa sau build nằm trong GitHub Actions.
- Các bài kiến thức cũ vẫn được giữ; phần mô tả toàn bộ thương hiệu và khối quảng bá app được thay.
- Cập nhật ngày sửa trong sitemap cho các trang giới thiệu thực sự thay đổi.
- Khi tái sinh footer, giữ cả thông báo sản phẩm có cụm “không phải thuốc”.

## Kiểm chứng
- 2.415 khối JSON-LD hợp lệ.
- Nội dung chính của 413 bài viết giữ nguyên, ngoại trừ khối thương hiệu / lời mời app / ghi chú lịch sử.
- Không còn các mẫu quảng bá chung “AI Coach Đông y cá nhân hoá theo thể tạng”, “6 chỉ số lối sống theo Đông y”, hoặc mô tả “The Tao Engineer” trong HTML.
- Bộ chuẩn hóa chạy lại không thay đổi file.
- Đã bấm thật từ giới thiệu sang trang app và đổi ngôn ngữ trong trình duyệt; kiểm tra màn hình điện thoại và máy tính.
- Repo website không có lệnh /iki-checkup; dùng kiểm tra HTML/JSON-LD, so sánh nội dung và thao tác trình duyệt thực tế.

## Phần ngoài website
LinkedIn, X, Substack và hồ sơ ứng dụng cần dùng cùng bản giới thiệu hiện tại. Chưa thay đổi nội dung các tài khoản đó trong đợt sửa website này. Không xoá bài cũ hoặc tuyên bố đã cập nhật câu trả lời của Grok.

Việc cập nhật website không tự xoá chỉ mục cũ hoặc trí nhớ mô hình. IndexNow là thông báo URL thay đổi cho các công cụ tham gia, không phải bảo đảm lập chỉ mục. Google có thể cần vài ngày đến vài tuần để thu thập lại: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
