# Setup Microsoft Clarity — Hướng dẫn

## Tại sao Clarity?

Clarity là **free unlimited** analytics service từ Microsoft, mạnh nhất ở 2 tính năng:
- **Heatmap** — xem hot zone user click/scroll trên từng page
- **Session recording** — xem video screencast của user thật (anonymous)
- **Insights AI** — tự cảnh báo: rage click, dead click, JS error, slow page

Với 2 sales page IKI, đây là tool số 1 để tối ưu CTA placement.

## Setup (5 phút)

### Bước 1: Đăng ký
1. Vào https://clarity.microsoft.com/
2. Sign in bằng `tmdv.hopecorp@gmail.com` (cùng Google account)
3. Click **"+ Add new project"**

### Bước 2: Tạo project
- **Name**: `IKI Web` (hoặc tuỳ anh)
- **Website URL**: `https://ikihealing.com`
- **Category**: Health & Wellness
- Click **Create**

### Bước 3: Lấy Project ID
- Sau khi tạo, click **Setup → Get tracking code**
- Trong code snippet, có dòng kiểu:
  ```js
  })(window, document, "clarity", "script", "abc1234xyz");
  ```
- **Copy đoạn `abc1234xyz`** (10 ký tự cuối) — đó là Project ID

### Bước 4: Replace vào code

Có 2 cách:

**Cách 1 (anh tự sửa):**
- Mở 15 file HTML trong repo
- Tìm `YOUR_CLARITY_ID` → replace với Project ID anh vừa copy
- Push lên main → deploy
- *Dùng VS Code "Find & Replace in files" → 30 giây*

**Cách 2 (báo Claude làm hộ):**
- Anh paste Project ID cho Claude
- Claude sẽ replace + commit + push trong 1 phút

### Bước 5: Verify
- Sau khi deploy, vào https://ikihealing.com
- Đợi ~5 phút
- Quay lại Clarity dashboard → tab **Live** → sẽ thấy session đầu tiên (anh đang truy cập)

## Cách dùng Clarity hiệu quả

### 1. Heatmap (sau 100 sessions)
- Dashboard → **Heatmaps** → chọn page → chọn loại:
  - **Click map**: hot spots user click (button quan trọng?)
  - **Scroll map**: % user scroll đến đâu (CTA có above-fold không?)
  - **Area map**: vùng hover lâu nhất

→ Áp dụng cho `/3ngayreset.html`: thấy form đăng ký có ở vùng user scroll đến không.

### 2. Session recordings
- Dashboard → **Recordings**
- Filter: "Has rage click", "Has dead click", "Mobile only", "From utm_source = fb_iki"
- Click 1 session → xem video screencast user thật làm gì
- Tip: tăng tốc 2x để xem nhanh

→ Cực hữu ích để debug: "Tại sao user vào landing page xong thoát?"

### 3. Insights AI
- Dashboard → **Insights**
- Clarity AI tự phân tích, gợi ý:
  - "5% user rage click button X — có lẽ button không work"
  - "30% session bị JS error trên page Y"
  - "Page Z mobile load chậm 4.5s"

### 4. Filter quan trọng
- **Funnel campaign**: filter `utm_source = fb_iki` → chỉ xem session đến từ Facebook IKI
- **Mobile vs Desktop**: track riêng để optimize từng platform
- **Country**: chỉ Vietnam visitor

## Privacy & Compliance

- ✅ **GDPR + CCPA + LGPD compliant** — Clarity tự động mask sensitive fields (password, credit card, email field)
- ✅ **NĐ 13/2023 (VN)**: Clarity không lưu PII (personally identifiable info), session ID là random hash
- ⚠️ **Cần update Privacy Policy**: thêm 1 dòng về Clarity (em update giúp khi anh báo Project ID)

## Roadmap migration

Khi App IKI launch:
1. Set up Clarity riêng cho `app.ikihealing.com`
2. Cross-domain tracking (Clarity hỗ trợ)
3. Funnel: visit web → submit form → register app → active user

## Troubleshooting

### Không thấy session sau 10 phút
1. Inspect page (F12) → Console tab
2. Tìm error liên quan `clarity.ms`
3. Check: đã replace `YOUR_CLARITY_ID` đúng chưa?
4. Check: Project ID copy đúng chưa? (10 ký tự, không có space)

### Heatmap empty sau 1 ngày
- Clarity cần ít nhất ~100 sessions để build heatmap accurate
- Đợi traffic tự nhiên hoặc share link trên social để có nhanh

### Recording bị mask quá nhiều
- Default Clarity mask all input để bảo vệ privacy
- Để xem nội dung input (không khuyến nghị): Settings → Masking → Strict (giữ nguyên)
- Em recommend giữ Strict — đỡ rủi ro vi phạm NĐ 13/2023.
