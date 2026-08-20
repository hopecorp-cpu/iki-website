#!/usr/bin/env node
/**
 * Nhúng video YouTube vào đúng bài blog của nó + khai schema VideoObject đầy đủ.
 *
 * Đây là NỬA CÒN LẠI của vòng SEO: mô tả video trỏ về bài blog (máy tải lên lo), còn bài blog trỏ
 * ngược lên video. Thiếu một nửa thì Google và trợ lý AI không nối được hai thứ với nhau.
 *
 * BỐN ĐIỀU CỦA BỘ QUY TẮC THI HÀNH Ở ĐÂY (xem hope-ops-hub/scripts/video-blog/quy-tac-seo.mjs):
 *   7. VideoObject đủ trường, uploadDate là NGÀY VIDEO LÊN THẬT — không phải ngày đăng bài.
 *      Bản đầu lấy nhầm datePublished của bài (12/08) trong khi video lên 20/08: khai sai dữ kiện.
 *   8. Khối video nằm TRONG 30% ĐẦU trang, ngay trước thẻ h2 đầu tiên. Google chỉ trao kết quả
 *      video cho trang đặt video ở chỗ dễ thấy; nhét cuối bài thì coi như không có.
 *   9. Ghi video-index.json để build-structure.mjs khai thẻ video trong sitemap. Ghi ra FILE trong
 *      repo chứ không đọc thẳng kho trên máy CEO, vì bản dựng chạy trên GitHub không thấy kho đó.
 *  10. Thêm hasPart/Clip theo mốc chương — đây là cách khai "khoảnh khắc chính" cho Google.
 *
 * Nguồn mã video: ~/Downloads/IKI-VIDEO-BLOG/<slug>/youtube.json (tai-len-youtube.mjs ghi) và
 * chuong.json (moc-chuong.mjs ghi).
 *
 * Chạy: node scripts/nhung-video-blog.mjs [--commit] [--lam-lai]
 *   --lam-lai  gỡ khối cũ rồi chèn lại (dùng khi đổi vị trí hoặc đổi schema)
 */
import fs from "fs";
import path from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KHO = path.join(homedir(), "Downloads", "IKI-VIDEO-BLOG");
const COMMIT = process.argv.includes("--commit");
const LAM_LAI = process.argv.includes("--lam-lai");
const MOC = "<!-- video-youtube -->";
const HET = "<!-- /video-youtube -->";

if (!fs.existsSync(KHO)) { console.error("Không thấy kho video:", KHO); process.exit(1); }

const iso = (g) => {
  g = Math.max(1, Math.round(g || 0));
  const h = Math.floor(g / 3600), p = Math.floor((g % 3600) / 60), s = g % 60;
  return "PT" + (h ? `${h}H` : "") + (p ? `${p}M` : "") + (s ? `${s}S` : "");
};

const ds = fs.readdirSync(KHO)
  .map((slug) => ({ slug, f: path.join(KHO, slug, "youtube.json"), c: path.join(KHO, slug, "chuong.json") }))
  .filter((x) => fs.existsSync(x.f))
  .map((x) => ({
    slug: x.slug,
    ...JSON.parse(fs.readFileSync(x.f, "utf8")),
    chuong: fs.existsSync(x.c) ? JSON.parse(fs.readFileSync(x.c, "utf8")).chuong || [] : [],
  }))
  .filter((x) => x.videoId);

if (!ds.length) { console.error("Chưa video nào lên YouTube. Chạy tai-len-youtube.mjs trước."); process.exit(1); }

const css = `
    .post-video{margin:28px 0}
    .post-video .pv-khung{position:relative;padding-top:56.25%;border-radius:16px;overflow:hidden;background:#0d1f14}
    .post-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
    .post-video figcaption{margin-top:10px;font-size:.9rem;color:#6B7A6B;text-align:center}`;

let them = 0, daCo = 0, lamLai = 0, thieuBai = [], chiMuc = [];
for (const v of ds) {
  const p = path.join(ROOT, "blog", `${v.slug}.html`);
  if (!fs.existsSync(p)) { thieuBai.push(v.slug); continue; }
  let html = fs.readFileSync(p, "utf8");

  const h1 = (html.match(/<h1[^>]*class="post-title"[^>]*>([^<]*)/) || [])[1] || v.slug;
  const tenVideo = v.tieuDe || h1;
  const moTa = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  // ĐIỀU 7: ngày đăng THẬT của video. Không có thì thà bỏ trống schema còn hơn khai ngày của bài.
  const ngay = (v.ngayDang || v.luc || "").slice(0, 10);
  const giay = v.thoiLuongGiay || (v.chuong.length ? v.chuong[v.chuong.length - 1].giay + 30 : 0);

  chiMuc.push({
    slug: v.slug, videoId: v.videoId, ten: tenVideo, moTa: moTa.slice(0, 2000),
    anh: `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`, ngay, giay,
  });

  const daNhung = html.includes(MOC);
  if (daNhung && !LAM_LAI) { daCo++; continue; }

  if (daNhung) {
    html = html.replace(new RegExp(`\\s*${MOC}[\\s\\S]*?${HET}`, "g"), "");
    html = html.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"VideoObject"[\s\S]*?<\/script>\s*/g, "");
    lamLai++;
  }

  const khoi = `${MOC}
        <figure class="post-video">
          <div class="pv-khung">
            <iframe src="https://www.youtube-nocookie.com/embed/${v.videoId}" title="${tenVideo.replace(/"/g, "&quot;")}"
              loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
          </div>
          <figcaption>Bản đọc ${giay ? Math.round(giay / 60) + " phút " : ""}của bài này — nghe được khi đang lái xe hoặc nấu ăn.</figcaption>
        </figure>
        ${HET}`;

  const schema = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "VideoObject",
    name: tenVideo,
    description: moTa.slice(0, 300),
    thumbnailUrl: [`https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`],
    ...(ngay ? { uploadDate: ngay } : {}),
    ...(giay ? { duration: iso(giay) } : {}),
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
    inLanguage: "vi",
    publisher: {
      "@type": "Organization", name: "IKI Healing — HOPE CORP",
      logo: { "@type": "ImageObject", url: "https://ikihealing.com/assets/banners/iki-banner-1200x630-og.jpg" },
    },
    // ĐIỀU 10: khai từng chương thành Clip -> đây là đường chính thức để Google hiện
    // "khoảnh khắc chính" ngay trên trang kết quả, chiếm chỗ gấp mấy lần một dòng link.
    ...(v.chuong.length >= 3 ? {
      hasPart: v.chuong.map((c, i) => ({
        "@type": "Clip", name: c.nhan, startOffset: c.giay,
        endOffset: i + 1 < v.chuong.length ? v.chuong[i + 1].giay : (giay || c.giay + 30),
        url: `https://www.youtube.com/watch?v=${v.videoId}&t=${c.giay}s`,
      })),
    } : {}),
  })}</script>`;

  // ĐIỀU 8: chèn ngay TRƯỚC thẻ h2 đầu tiên của thân bài (sau đoạn mở đầu), không nhét cuối bài.
  const than = html.indexOf('<div class="post-body">');
  if (than < 0) { thieuBai.push(v.slug + " (không thấy thân bài)"); continue; }
  const h2 = html.indexOf("<h2", than);
  const cho = h2 > 0 ? h2 : html.indexOf("</p>", than) + 4;
  if (cho <= 4) { thieuBai.push(v.slug + " (không có chỗ chèn)"); continue; }
  html = html.slice(0, cho) + khoi + "\n\n" + html.slice(cho);

  if (!html.includes(".post-video{")) html = html.replace(".post-cta p{margin:0 0 16px;opacity:.95}", ".post-cta p{margin:0 0 16px;opacity:.95}" + css);
  html = html.replace("</head>", `${schema}\n</head>`);

  if (COMMIT) fs.writeFileSync(p, html);
  them++;
}

if (COMMIT) fs.writeFileSync(path.join(ROOT, "video-index.json"), JSON.stringify(chiMuc, null, 2));

console.log(`Video có mã: ${ds.length} · nhúng thêm: ${them} · dựng lại: ${lamLai} · bỏ qua (đã có): ${daCo}`);
console.log(`Chỉ mục cho sitemap: ${chiMuc.length} video${COMMIT ? " -> video-index.json" : " (chưa ghi, thiếu --commit)"}`);
if (thieuBai.length) console.log("Không nhúng được:", thieuBai.join(", "));
if (!COMMIT) console.log("\nXem thử. Thêm --commit để ghi thật.");
