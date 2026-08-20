/**
 * Khối video YouTube + schema VideoObject cho bài blog — cắm THẲNG vào máy dựng bài.
 *
 * VÌ SAO Ở ĐÂY chứ không chèn sau khi dựng: HTML trong blog/ là FILE MÁY SINH. Bản đầu chèn khối
 * video vào HTML sau khi dựng, và lượt build tự động kế tiếp (workflow build-blog trên GitHub)
 * xoá sạch — đúng cái bẫy sổ tay đã ghi. Khối CTA sản phẩm sống sót vì nó đi qua build-article;
 * khối video thì không. Nay đi cùng một cửa.
 *
 * Nguồn: video-index.json ở gốc repo, do scripts/nhung-video-blog.mjs ghi từ kho video trên máy
 * CEO. CỐ Ý đi qua file trong repo: bản dựng chạy trên GitHub không thấy thư mục ~/Downloads.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let _chiMuc = null;
function chiMuc() {
  if (_chiMuc) return _chiMuc;
  const p = path.join(ROOT, "video-index.json");
  _chiMuc = {};
  if (fs.existsSync(p)) {
    try {
      for (const v of JSON.parse(fs.readFileSync(p, "utf8"))) if (v.slug && v.videoId) _chiMuc[v.slug] = v;
    } catch (e) { console.warn("  video-index.json hỏng, bỏ qua khối video:", e.message); }
  }
  return _chiMuc;
}

export const videoCuaBai = (slug) => chiMuc()[slug] || null;

const iso = (g) => {
  g = Math.max(1, Math.round(g || 0));
  const h = Math.floor(g / 3600), p = Math.floor((g % 3600) / 60), s = g % 60;
  return "PT" + (h ? `${h}H` : "") + (p ? `${p}M` : "") + (s ? `${s}S` : "");
};

export const CSS_VIDEO = `
    .post-video{margin:28px 0}
    .post-video .pv-khung{position:relative;padding-top:56.25%;border-radius:16px;overflow:hidden;background:#0d1f14}
    .post-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
    .post-video figcaption{margin-top:10px;font-size:.9rem;color:#6B7A6B;text-align:center}`;

function khoiVideo(v) {
  const ten = String(v.ten || "").replace(/"/g, "&quot;");
  const phut = v.giay ? `${Math.round(v.giay / 60)} phút ` : "";
  return `<figure class="post-video">
<div class="pv-khung"><iframe src="https://www.youtube-nocookie.com/embed/${v.videoId}" title="${ten}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
<figcaption>Bản đọc ${phut}của bài này — nghe được khi đang lái xe hoặc nấu ăn.</figcaption>
</figure>`;
}

/**
 * Chèn khối video vào thân bài, NGAY TRƯỚC thẻ h2 đầu tiên (tức sau đoạn mở đầu).
 * Google chỉ trao kết quả video cho trang đặt video ở chỗ dễ thấy; nhét cuối bài thì coi như
 * không có. Không tìm thấy h2 thì đặt sau đoạn văn đầu tiên; không có cả hai thì đặt lên đầu.
 */
export function chenVideo(html, slug) {
  const v = videoCuaBai(slug);
  if (!v) return html;
  const khoi = "\n" + khoiVideo(v) + "\n";
  const h2 = html.search(/<h2[\s>]/);
  if (h2 >= 0) return html.slice(0, h2) + khoi + html.slice(h2);
  const p = html.indexOf("</p>");
  return p >= 0 ? html.slice(0, p + 4) + khoi + html.slice(p + 4) : khoi + html;
}

/** VideoObject đủ trường + hasPart/Clip theo mốc chương (đường chính thức khai khoảnh khắc chính). */
export function schemaVideo(slug, moTaBai = "") {
  const v = videoCuaBai(slug);
  if (!v) return null;
  const ch = v.chuong || [];
  return {
    "@context": "https://schema.org", "@type": "VideoObject",
    name: v.ten,
    description: (v.moTa || moTaBai || v.ten).slice(0, 300),
    thumbnailUrl: [v.anh || `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`],
    ...(v.ngay ? { uploadDate: v.ngay } : {}),
    ...(v.giay ? { duration: iso(v.giay) } : {}),
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
    inLanguage: "vi",
    publisher: {
      "@type": "Organization", name: "IKI Healing — HOPE CORP",
      logo: { "@type": "ImageObject", url: "https://ikihealing.com/assets/banners/iki-banner-1200x630-og.jpg" },
    },
    ...(ch.length >= 3 ? {
      hasPart: ch.map((c, i) => ({
        "@type": "Clip", name: c.nhan, startOffset: c.giay,
        endOffset: i + 1 < ch.length ? ch[i + 1].giay : (v.giay || c.giay + 30),
        url: `https://www.youtube.com/watch?v=${v.videoId}&t=${c.giay}s`,
      })),
    } : {}),
  };
}
