// Chú thích ảnh AI dưới ảnh hero bài blog (TH 07/10/2026 10:37; quy tắc bật/tắt TH chốt 10:44).
// Quy tắc: CHỈ in <figure> + <figcaption> "Ảnh minh hoạ được tạo bằng AI." ngay dưới ảnh hero khi
// frontmatter có "anh_ai": true (đúng kiểu boolean true) VÀ bài có ảnh hero (hero_local hoặc hero_image).
// Không có cờ, "anh_ai": false, hay giá trị khác true (vd chuỗi "true") → TẮT: ảnh chụp thật mà ghi
// "tạo bằng AI" là sai sự thật. Bài không có hero: không in gì.
// Dòng chữ AI đóng sẵn trong ảnh giữ nguyên — module này không đụng tới file ảnh.
// File thuần (không ghi file khi import) để test nạp được.
export const CHU_THICH_AI = "Ảnh minh hoạ được tạo bằng AI.";

// Cỡ 13px, xám đậm #4A4A4A (tương phản 8,86:1 trên nền trắng), chữ đứng, font chữ thân (không monospace).
export const CSS_CHU_THICH_AI = `
    .post-hero-fig{margin:0}
    .post-hero-fig .post-hero-img{display:block}
    .post-hero-cap{margin:8px 0 0;font-family:var(--font-sans,'Manrope'),system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.5;font-style:normal;font-weight:400;color:#4A4A4A}`;

export function coChuThichAi(fm, heroSrc) {
  return Boolean(heroSrc) && fm.anh_ai === true;
}

// imgHtml: thẻ <img class="post-hero-img" ...> đã dựng sẵn. Trả về chuỗi HTML đặt vào khối .post-hero.
export function heroHtml(fm, heroSrc, imgHtml, indent = "        ") {
  if (!heroSrc) return "";
  if (!coChuThichAi(fm, heroSrc)) return imgHtml;
  return `<figure class="post-hero-fig">\n${indent}${imgHtml}\n${indent}<figcaption class="post-hero-cap">${CHU_THICH_AI}</figcaption>\n${indent}</figure>`;
}
