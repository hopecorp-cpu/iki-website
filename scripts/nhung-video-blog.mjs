#!/usr/bin/env node
/**
 * Nhúng video YouTube vào đúng bài blog của nó + khai schema VideoObject.
 *
 * Đây là NỬA CÒN LẠI của vòng SEO: mô tả video trỏ về bài blog (do máy tải lên lo), còn bài blog
 * trỏ ngược lên video. Thiếu một nửa thì Google và trợ lý AI không nối được hai thứ với nhau.
 *
 * Nguồn mã video: ~/Downloads/IKI-VIDEO-BLOG/<slug>/youtube.json do tai-len-youtube.mjs ghi.
 * Idempotent theo mốc <!-- video-youtube -->; chạy lại không nhân đôi.
 *
 * Chạy: node scripts/nhung-video-blog.mjs [--commit]
 */
import fs from "fs";
import path from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KHO = path.join(homedir(), "Downloads", "IKI-VIDEO-BLOG");
const COMMIT = process.argv.includes("--commit");
const MOC = "<!-- video-youtube -->";

if (!fs.existsSync(KHO)) { console.error("Không thấy kho video:", KHO); process.exit(1); }

const ds = fs.readdirSync(KHO)
  .map((slug) => ({ slug, f: path.join(KHO, slug, "youtube.json") }))
  .filter((x) => fs.existsSync(x.f))
  .map((x) => ({ slug: x.slug, ...JSON.parse(fs.readFileSync(x.f, "utf8")) }))
  .filter((x) => x.videoId);

if (!ds.length) { console.error("Chưa video nào lên YouTube (không thấy youtube.json). Chạy tai-len-youtube.mjs trước."); process.exit(1); }

let them = 0, daCo = 0, thieuBai = [];
for (const v of ds) {
  const p = path.join(ROOT, "blog", `${v.slug}.html`);
  if (!fs.existsSync(p)) { thieuBai.push(v.slug); continue; }
  let html = fs.readFileSync(p, "utf8");
  if (html.includes(MOC)) { daCo++; continue; }

  const tieuDe = (html.match(/<h1[^>]*class="post-title"[^>]*>([^<]*)/) || [])[1] || v.slug;
  const moTa = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const ngay = (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1] || new Date().toISOString().slice(0, 10);

  // loading="lazy" vì khối nằm giữa bài: nhúng nặng mà tải ngay thì kéo tụt Core Web Vitals của
  // chính bài đang muốn lên hạng.
  const khoi = `${MOC}
        <figure class="post-video">
          <div class="pv-khung">
            <iframe src="https://www.youtube-nocookie.com/embed/${v.videoId}" title="${tieuDe.replace(/"/g, "&quot;")}"
              loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
          </div>
          <figcaption>Bản đọc của bài này — nghe được khi đang lái xe hoặc nấu ăn.</figcaption>
        </figure>`;

  const schema = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "VideoObject",
    name: tieuDe, description: moTa.slice(0, 300),
    thumbnailUrl: [`https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`],
    uploadDate: ngay, embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}`,
    publisher: { "@type": "Organization", name: "IKI Healing — HOPE CORP" },
  })}</script>`;

  const css = `
    .post-video{margin:32px 0}
    .post-video .pv-khung{position:relative;padding-top:56.25%;border-radius:16px;overflow:hidden;background:#0d1f14}
    .post-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
    .post-video figcaption{margin-top:10px;font-size:.9rem;color:#6B7A6B;text-align:center}`;

  // Đặt NGAY SAU thân bài, trước khối sản phẩm: người đọc hết bài rồi mới mời nghe lại.
  if (!html.includes("<!-- cta-san-pham -->") && !html.includes('<div class="post-cta">')) { thieuBai.push(v.slug + " (không có chỗ chèn)"); continue; }
  const neo = html.includes("<!-- cta-san-pham -->") ? "<!-- cta-san-pham -->" : '        <div class="post-cta">';
  html = html.replace(neo, `${khoi}\n\n${neo}`);
  if (!html.includes(".post-video{")) html = html.replace(".post-cta p{margin:0 0 16px;opacity:.95}", ".post-cta p{margin:0 0 16px;opacity:.95}" + css);
  html = html.replace("</head>", `${schema}\n</head>`);

  if (COMMIT) fs.writeFileSync(p, html);
  them++;
}

console.log(`Video có mã: ${ds.length} · bài đã nhúng sẵn: ${daCo} · nhúng thêm: ${them}`);
if (thieuBai.length) console.log("Không nhúng được:", thieuBai.join(", "));
if (!COMMIT) console.log("\nXem thử. Thêm --commit để ghi thật.");
