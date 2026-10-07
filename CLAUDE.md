## Luật thiết kế web (CEO 06/10/2026 15:52, bắt buộc)
- Không nền kem/off-white. Ngưỡng nền ấm-sáng: R≥G≥B, độ sáng HSL > 90%, R−B ≥ 6 (kể cả biến CSS, inline, fill SVG nền, chế độ tối). Không miễn huy hiệu trạng thái. Nền dùng #ffffff hoặc xám lạnh rất nhạt. Hồng #f3e8e8 / #f3e4e7 / #FFF4F7 nếu là nền khối thì về #ffffff, giữ viền hoặc vệt hồng; giữ nếu chỉ là chữ/viền. #f3f7f2 (xanh lạnh) được giữ.
- Không in nghiêng chữ nhấn trong h1–h3 (<em>, <i>, font-style:italic). Nhấn bằng font-weight 700 hoặc màu thương hiệu.
- Không nhãn mục đánh số 01/02/03, không dạng «N ·» (1–9 không số 0 đầu), không .sec-num. Bỏ số, giữ tên mục.
- Không font monospace cho nhãn/eyebrow hay chữ SVG <text> (font-mono, ui-monospace, JetBrains/IBM Plex Mono). Chỉ khối code/pre và mã dữ liệu được dùng.
- Không nút pill (border-radius ≥ ½ chiều cao, 999px, rounded-full trên button/a/Link). Nút bo 8px; nhãn/badge 6–8px; nút tròn chỉ có icon thì giữ.
- Trước khi báo xong: chạy `node scripts/kiem-luat-web.mjs` (và scan.py nếu có trong phong-chung/hang-cho-duyet/ra-soat-luat-web-0610/_cong-cu/) → 0 vi phạm, dán kết quả vào PR.
