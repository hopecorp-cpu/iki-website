## Luật thiết kế web (CEO 06/10/2026 15:52, bắt buộc)
- Không nền kem/off-white (#f8f4ee, #fffaf0, #faf7f2, #fbf9f3, #F7F7F2, #F4F2EC, ivory, linen, cream, beige…). Nền dùng #ffffff hoặc xám lạnh rất nhạt (#f7f8fa).
- Không in nghiêng chữ nhấn trong h1–h3 (<em>, <i>, font-style:italic). Nhấn bằng font-weight 700 hoặc màu thương hiệu.
- Không nhãn mục đánh số 01/02/03 (kể cả "01 ·", "01 /"). Bỏ số, giữ tên mục.
- Không font monospace cho nhãn/eyebrow (font-mono, ui-monospace, JetBrains/IBM Plex Mono). Chỉ khối code thật được dùng.
- Không nút pill (border-radius ≥ ½ chiều cao, 999px, rounded-full trên button/a/Link). Nút bo 8px; nhãn/badge 6–8px; nút tròn chỉ có icon thì giữ.
- Trước khi báo xong: chạy `node scripts/kiem-luat-web.mjs` (và scan.py nếu có trong phong-chung/hang-cho-duyet/ra-soat-luat-web-0610/_cong-cu/) → 0 vi phạm, dán kết quả vào PR.
