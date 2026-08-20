#!/usr/bin/env node
/**
 * Nối video YouTube với bài blog của nó.
 *
 * Máy này CHỈ làm hai việc: ghi chỉ mục video-index.json, rồi bảo máy dựng bài dựng lại bài đó.
 * Khối video và schema nằm ở scripts/video-bai.mjs và được build-article.mjs gọi.
 *
 * VÌ SAO PHẢI VẬY (bài học 20/08): bản đầu chèn thẳng khối video vào HTML đã dựng. Lượt build tự
 * động kế tiếp trên GitHub sinh lại HTML từ blog-drafts và XOÁ SẠCH — không báo lỗi, không ai
 * thấy, chỉ là schema biến mất. HTML trong blog/ là file máy sinh; muốn thứ gì sống sót thì phải
 * cắm vào máy sinh ra nó.
 *
 * Bài KHÔNG có bản nháp .md (máy viết blog trên Vercel commit thẳng HTML) thì không dựng lại được
 * -> vẫn chèn tay vào HTML, và nói rõ ra là bài đó sẽ mất khối video nếu về sau có ai dựng lại.
 *
 * Chạy: node scripts/nhung-video-blog.mjs [--commit]
 */
import fs from "fs";
import path from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KHO = path.join(homedir(), "Downloads", "IKI-VIDEO-BLOG");
const COMMIT = process.argv.includes("--commit");
const MOC = "<!-- video-youtube -->";
const HET = "<!-- /video-youtube -->";

if (!fs.existsSync(KHO)) { console.error("Không thấy kho video:", KHO); process.exit(1); }

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

// Bước 1: chỉ mục. Phải ghi TRƯỚC khi dựng lại bài, vì build-article đọc chính file này.
const chiMuc = [];
for (const v of ds) {
  const p = path.join(ROOT, "blog", `${v.slug}.html`);
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, "utf8");
  const h1 = (html.match(/<h1[^>]*class="post-title"[^>]*>([^<]*)/) || [])[1] || v.slug;
  chiMuc.push({
    slug: v.slug, videoId: v.videoId, ten: v.tieuDe || h1,
    moTa: ((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "").slice(0, 2000),
    anh: `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`,
    ngay: (v.ngayDang || v.luc || "").slice(0, 10),
    giay: v.thoiLuongGiay || 0,
    chuong: v.chuong,
  });
}
if (!COMMIT) {
  console.log(`Sẽ khai ${chiMuc.length} video vào video-index.json rồi dựng lại từng bài.`);
  chiMuc.forEach((v) => console.log(`  - ${v.slug} -> ${v.videoId} (${v.chuong.length} chương${fs.existsSync(path.join(ROOT, "blog-drafts", `${v.slug}.md`)) ? "" : ", KHÔNG có nháp .md"})`));
  console.log("\nXem thử. Thêm --commit để ghi thật.");
  process.exit(0);
}
fs.writeFileSync(path.join(ROOT, "video-index.json"), JSON.stringify(chiMuc, null, 2));

// Bước 2: dựng lại bài để khối video + schema đi qua đúng cửa build-article.
let dung = 0, chen = 0, hong = [];
for (const v of chiMuc) {
  const nhap = path.join(ROOT, "blog-drafts", `${v.slug}.md`);
  if (fs.existsSync(nhap)) {
    try {
      execFileSync("node", [path.join(ROOT, "scripts", "build-article.mjs"), nhap], { cwd: ROOT, stdio: "pipe" });
      dung++;
    } catch (e) { hong.push(`${v.slug} (dựng lại hụt: ${String(e.stderr || e.message).slice(0, 120)})`); }
    continue;
  }
  // Không có nháp: chèn tay, và khối này sẽ MẤT nếu về sau bài được dựng lại từ nguồn khác.
  const p = path.join(ROOT, "blog", `${v.slug}.html`);
  let html = fs.readFileSync(p, "utf8");
  if (html.includes(MOC)) { continue; }
  const than = html.indexOf('<div class="post-body">');
  const h2 = than >= 0 ? html.indexOf("<h2", than) : -1;
  if (h2 < 0) { hong.push(`${v.slug} (không thấy chỗ chèn)`); continue; }
  const khoi = `${MOC}\n<figure class="post-video"><div class="pv-khung"><iframe src="https://www.youtube-nocookie.com/embed/${v.videoId}" title="${String(v.ten).replace(/"/g, "&quot;")}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe></div><figcaption>Bản đọc của bài này — nghe được khi đang lái xe hoặc nấu ăn.</figcaption></figure>\n${HET}\n`;
  fs.writeFileSync(p, html.slice(0, h2) + khoi + html.slice(h2));
  chen++;
  console.warn(`  ${v.slug}: KHÔNG có nháp .md — đã chèn tay, khối này sẽ mất nếu bài được dựng lại`);
}

console.log(`Video: ${chiMuc.length} · dựng lại bài: ${dung} · chèn tay: ${chen}`);
if (hong.length) { console.log("Hỏng:", hong.join(" · ")); process.exitCode = 1; }
