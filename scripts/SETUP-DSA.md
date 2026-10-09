# Chạy Google DSA (quảng cáo tìm kiếm động) cho ikihealing.com

Soạn 09/10/2026 sau webinar SEO/GEO 08/10 (anh Định, Cro.com.vn). Máy KHÔNG tự tạo chiến dịch:
người có quyền tài khoản Google Ads bấm theo các bước dưới. Trần ngân sách 1.000.000đ/ngày
(`ads_max_daily_budget`) áp cho cả DSA.

## 0. Điều kiện trước khi bật

- 8/9 chiến dịch hiện tại đang ở trạng thái "limited". Chi tiêu tụt từ khoảng 6,1 triệu (tháng 8)
  xuống khoảng 3-4 nghìn đồng/ngày từ giữa tháng 9. Mở từng chiến dịch, xem lý do "limited"
  (giới hạn ngân sách hay bị chặn bởi chính sách y tế/sức khoẻ) trước. Nếu do chính sách,
  DSA sẽ dính lại đúng lỗi đó.
- Chuyển đổi phải đo được: thẻ GTM `GTM-N23BLRJD` + `AW-18332022859` đã có trên trang;
  kiểm trong Google Ads > Mục tiêu > Chuyển đổi xem hành động "lead"/"mua" còn ghi nhận.

## 1. Sinh feed trang

    node scripts/dsa-page-feed.mjs

Ra `data/dsa-page-feed.csv`, hai cột `Page URL`, `Custom label`. Nhãn:

| Nhãn | Là gì | Chạy |
|---|---|---|
| `bofu` | trang sản phẩm, /shop, /quiz | đợt 1 |
| `mofu` | bài so sánh, chọn, phân biệt | đợt 2 |
| `tofu` | bài kiến thức | đợt 3 |
| `nhay-cam` | thai sản, trẻ em, thuốc, tên bệnh | LOẠI |

Script tự bỏ bài danh mục cẩm nang bệnh, mọi trang Trà Tuệ Minh (đã gỡ khỏi truyền thông
03/10), bản en/ja và trang chính sách.

## 2. Tạo chiến dịch (quy trình X: đáy trước)

1. Công cụ > Thư viện dùng chung > Dữ liệu kinh doanh > + Nguồn cấp dữ liệu trang > tải CSV.
2. Chiến dịch mới > Mục tiêu "Khách hàng tiềm năng" (hoặc "Doanh số") > Tìm kiếm.
3. Tắt Mạng hiển thị. Tắt AI Max/mở rộng tự động. Vị trí Việt Nam, ngôn ngữ tiếng Việt.
4. Nhóm quảng cáo loại Động > Mục tiêu theo "Nhãn tuỳ chỉnh" = `bofu`. Thêm loại trừ nhãn `nhay-cam`.
5. Đặt tên: `DSA | BOFU | sản phẩm`. Ngân sách khởi điểm nhỏ (vd 50-100 nghìn/ngày).
6. Từ khoá phủ định ngay từ đầu: thuốc, chữa, trị, bệnh, bác sĩ, review lừa đảo, tên đối thủ.

Sau 5-7 ngày có số thì mới mở nhóm `mofu`, rồi `tofu` (mỗi nhóm một chiến dịch để tách tiền).

## 3. Đọc kết quả

- Google Ads > Từ khoá tìm kiếm: thêm phủ định cho truy vấn lạc đề mỗi tuần.
- ops-hub `/nguon-lead` > bảng "Trang nào ra lead": chỉ sửa SEO/CTA cho trang có lead.
  Trang chạy quảng cáo mà không ra lead sau 2 tuần thì loại khỏi feed.
