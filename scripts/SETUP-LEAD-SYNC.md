# Setup Google Sheets Lead Sync — Hướng dẫn

## Mục tiêu
Tự động sync lead từ form `/3ngayreset.html` + `/7ngaydetox.html` vào Google Sheet để quản lý tập trung.

## Luồng dữ liệu

```
User submit form trên web
    ↓
FormSubmit gửi email tới:
    ├── contact@ikihealing.com (chính, AZDIGI)
    └── tmdv.hopecorp@gmail.com (CC, Gmail)
                    ↓
        Apps Script đọc Gmail (mỗi 5 phút)
                    ↓
        Parse table → ghi vào Google Sheet "Leads"
```

## Các bước setup (10 phút, làm 1 lần duy nhất)

### Bước 1: Tạo Google Sheet
1. Mở https://sheets.new (tự tạo Sheet trống mới)
2. Đặt tên: `IKI Leads — HOPE CORP`
3. Đăng nhập bằng `tmdv.hopecorp@gmail.com` (cùng Gmail nhận lead CC)

### Bước 2: Mở Apps Script
1. Trong Sheet vừa tạo → menu **Extensions** → **Apps Script**
2. Tab mới mở ra → có đoạn code mặc định
3. **Xóa toàn bộ code mặc định**

### Bước 3: Paste code
1. Mở file `iki-lead-sync.gs` (cùng thư mục này)
2. Copy toàn bộ nội dung
3. Paste vào Apps Script editor
4. **Save** (Ctrl+S hoặc Cmd+S) → đặt tên project: `IKI Lead Sync`

### Bước 4: Chạy lần đầu
1. Trên thanh công cụ, dropdown chọn function **`setupOnce`**
2. Click nút **Run** (▶)
3. Lần đầu chạy sẽ yêu cầu authorize:
   - Click **"Review permissions"**
   - Chọn account `tmdv.hopecorp@gmail.com`
   - Click **"Advanced"** → **"Go to IKI Lead Sync (unsafe)"**
   - Click **"Allow"** cấp quyền Gmail + Sheets
4. Đợi ~10 giây → toast hiện "Setup hoàn tất!"

### Bước 5: Kiểm tra
1. Quay lại tab Sheet → tab **"Leads"** đã được tạo với headers màu xanh lime
2. Cột G (Trạng thái) có dropdown: Chưa liên hệ / Đã gọi / Đang follow / Đã chốt / Từ chối / Spam
3. Cột B (Funnel) có dropdown: 3 Ngày Reset / 7 Ngày Detox / Khác
4. Nếu đã có lead test → tự động xuất hiện trong Sheet

## Vận hành hằng ngày

- **Tự động**: Mỗi 5 phút Apps Script chạy → đọc email mới → ghi vào Sheet
- **Thủ công** (nếu muốn force sync ngay): Apps Script editor → chạy `syncLeads`
- **Email nguồn vẫn trong inbox**: Apps Script chỉ gắn label `IKI/Processed`, không xóa email
- **Reply user**: Click vào ô "Email subject" → mở Gmail link → reply như bình thường (Reply-To đã set sẵn email user)

## Cột trong Sheet

| Cột | Tên | Mô tả |
|---|---|---|
| A | Ngày đăng ký | yyyy-MM-dd HH:mm (giờ VN) |
| B | Funnel | 3 Ngày Reset / 7 Ngày Detox / Khác |
| C | Tên | Họ tên user |
| D | Email | Email user (click reply trong Gmail) |
| E | SĐT | Số điện thoại (gọi Sale chốt đơn) |
| F | Nguồn | Web (mặc định) — sau này có thể thêm Facebook, Zalo, etc. |
| G | Trạng thái | Sale tự update — quan trọng để follow up |
| H | Ghi chú | Sale ghi note: cuộc gọi, gói quan tâm, etc. |
| **I** | **utm_source** | Kênh đăng bài: `fb_iki`, `fb_personal`, `zalo_oa`, `email`, `pr` |
| **J** | **utm_medium** | Loại traffic: `social`, `newsletter`, `referral`, `cpc` |
| **K** | **utm_campaign** | Tên chiến dịch: `launch_3reset`, `tet_2026`, etc. |
| **L** | **utm_content** | Slug bài viết: `bai-1-thuc-don`, `live-2026-05-08`, etc. |
| **M** | **utm_term** | Keyword (Google Ads) hoặc rỗng |
| **N** | Landing page | URL user vào lần đầu (vd `/3ngayreset.html`) |
| **O** | Referrer | Web user đến từ đâu (vd `https://m.facebook.com`) |
| P | Email subject | Subject gốc — debug/verify |
| Q | Gmail link | Link mở email gốc trong Gmail |

## UTM Convention (anh dùng khi đăng bài)

| Kênh | utm_source | utm_medium |
|---|---|---|
| Facebook Page IKI | `fb_iki` | `social` |
| Facebook cá nhân | `fb_personal` | `social` |
| Zalo OA | `zalo_oa` | `social` |
| Email blast | `email` | `newsletter` |
| Báo chí PR | `pr` | `referral` |
| Google Ads | `google` | `cpc` |
| Facebook Ads | `fb_ads` | `paid_social` |
| YouTube | `youtube` | `social` |

**Cú pháp link:**
```
https://ikihealing.com/3ngayreset.html?utm_source=fb_iki&utm_medium=social&utm_content=bai-1-thuc-don&utm_campaign=launch_3reset
```

**Cùng 1 bài đăng 3 kênh** → giữ nguyên `utm_content` + `utm_campaign`, chỉ đổi `utm_source` & `utm_medium`.

JS trên web (file `script.js`) tự đọc UTM từ URL → lưu localStorage → inject vào form khi user đăng ký. Không cần làm gì thủ công ở browser.

## Tips dùng Sheet hiệu quả

### 1. Filter view theo trạng thái
- Data → Create a filter
- Filter cột G "Trạng thái" = "Chưa liên hệ" → chỉ hiện lead chưa gọi

### 2. Conditional formatting để dễ nhìn
- Format → Conditional formatting → cột G
  - "Đã chốt" → màu xanh lá
  - "Từ chối" → màu xám
  - "Spam" → màu đỏ

### 3. Pivot table báo cáo
- Insert → Pivot table
- Rows: Funnel
- Values: COUNTA email, COUNTIF status="Đã chốt"
- → tỉ lệ chốt theo funnel

### 4. Share cho team Sale
- Share Sheet với nhân viên Sale qua email
- Quyền: Editor (cho update Status, Notes)

## Troubleshooting

### Không thấy lead mới sync vào Sheet
1. Apps Script editor → chọn `debugParseLatest` → Run
2. Xem View → Logs (Cmd+Enter)
3. Nếu báo "No FormSubmit emails found" → Gmail anh chưa nhận được email FormSubmit
   - Check Gmail spam folder
   - Verify form đã có `_cc=tmdv.hopecorp@gmail.com`

### Lead bị duplicate
- Có thể do chạy `syncLeads` 2 lần liên tiếp
- Gắn label `IKI/Processed` cho thread đã xử lý → không xử lý lại

### Muốn re-sync toàn bộ (debug)
1. Xóa hết rows trong Sheet (giữ headers)
2. Apps Script → chạy `resetProcessedLabel` → bỏ label
3. Chạy `syncLeads` → re-import toàn bộ

### Trigger không tự chạy
- Apps Script editor → Triggers (icon đồng hồ bên trái)
- Verify có 1 trigger: `syncLeads` — Time-based — Every 5 minutes
- Nếu không có → chạy lại `setupOnce`

## Migration sang App IKI sau này

Khi App IKI launch với endpoint `/api/leads`, anh có thể:
1. Đổi form action: `https://formsubmit.co/...` → `https://api.ikihealing.com/leads`
2. App IKI ghi thẳng vào database
3. Sheet trở thành read-only mirror (sync 1 chiều từ DB)

Code Apps Script này vẫn dùng được như fallback / archive.
