#!/usr/bin/env node
// Ảnh đầu bài blog = ẢNH CHỤP THẬT từ Pixabay (CEO 20/11/2026), thay cho ảnh máy sinh.
// Đã dùng cách này cho cả 422 bài cũ (docs/anh-that-blog.md). Bài mới đi cùng một đường.
//
// Chạy từ gốc repo iki-website:
//   node scripts/anh-that-hero.mjs <slug> "<từ khoá tiếng Anh>" ["<từ khoá dự phòng>" ...]
//   --xem       chỉ tải ứng viên, dựng tấm xem thử, KHÔNG ghi ảnh
//   --chon=N    lấy ứng viên số N (đếm từ 0) thay vì ứng viên đầu
// Ví dụ: node scripts/anh-that-hero.mjs an-dau-phu-co-tot-khong "tofu dish" "tofu"
//
// Luật lọc: bỏ ảnh AI (nhãn hoặc đường dẫn có "generated", nhãn "ai"), bỏ thịt/hải sản/rượu/
// thuốc/thuốc lá/biểu tượng tôn giáo, bỏ ảnh đã dùng ở bài khác. Ảnh cắt giữa 1200x675, JPEG q82,
// không đóng logo. Ghi nguồn vào docs/anh-that-blog.md mục "Bài mới".
// Khoá Pixabay đọc từ biến môi trường PIXABAY_API_KEY hoặc ~/hope-corp/hope-ops-hub/.env.local
// (chỉ đọc trong code, không in ra).
import { createRequire } from "module";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const OPS = path.join(homedir(), "hope-corp/hope-ops-hub/");
const sharp = createRequire(OPS)("sharp");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOC = path.join(ROOT, "docs/anh-that-blog.md");
const W = 1200, H = 675;

const args = process.argv.slice(2);
const XEM = args.includes("--xem");
const CHON = Number((args.find((a) => a.startsWith("--chon=")) || "--chon=0").split("=")[1]);
const [slug, ...queries] = args.filter((a) => !a.startsWith("--"));
if (!slug || !/^[a-z0-9-]+$/.test(slug) || !queries.length) {
  console.error('Cách dùng: node scripts/anh-that-hero.mjs <slug> "<từ khoá tiếng Anh>" [...]');
  process.exit(2);
}

function khoa() {
  if (process.env.PIXABAY_API_KEY) return process.env.PIXABAY_API_KEY;
  const f = path.join(OPS, ".env.local");
  const d = existsSync(f) && readFileSync(f, "utf8").split("\n").find((l) => l.startsWith("PIXABAY_API_KEY="));
  if (!d) { console.error("Thiếu PIXABAY_API_KEY"); process.exit(2); }
  return d.split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");
}

const CAM = ["meat", "pork", "beef", "chicken", "fish", "salmon", "tuna", "shrimp", "prawn", "crab",
  "lobster", "seafood", "sashimi", "sushi", "bacon", "sausage", "ham", "wine", "beer", "alcohol",
  "whisky", "cocktail", "pills", "tablets", "capsule", "medicine", "syringe", "cigarette", "smoking",
  "bible", "buddha", "cross"];
function hong(h) {
  const tags = h.tags.toLowerCase().split(",").map((t) => t.trim());
  const url = h.pageURL.toLowerCase();
  if (tags.join(" ").includes("generated") || url.includes("generated") || tags.includes("ai") ||
      tags.includes("artificial intelligence") || url.includes("-ai-")) return "ảnh AI";
  const tu = new Set(tags.flatMap((t) => t.split(/\s+/)));
  const dinh = CAM.find((c) => tu.has(c));
  return dinh ? `nhãn "${dinh}"` : null;
}

async function layAnh(url) {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "iki-website-photo-fetch" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i === 4) throw e;
      await new Promise((s) => setTimeout(s, 4000 * (i + 1)));
    }
  }
}

const doc = readFileSync(DOC, "utf8");
const daDung = new Set([...doc.matchAll(/\[(\d+)\]\(https:\/\/pixabay/g)].map((m) => m[1]));
daDung.delete("10191078"); // ảnh AI cũ đã gỡ, để lọc AI chặn nó

const ungVien = [];
for (const q of queries) {
  const u = `https://pixabay.com/api/?key=${encodeURIComponent(khoa())}&q=${encodeURIComponent(q)}` +
    `&image_type=photo&orientation=horizontal&per_page=30&safesearch=true&min_width=1200`;
  const d = JSON.parse((await layAnh(u)).toString());
  for (const h of d.hits || []) {
    const ly = hong(h) || (daDung.has(String(h.id)) ? "đã dùng ở bài khác" : null);
    if (ly) continue;
    if (!ungVien.some((x) => x.id === h.id)) ungVien.push({ ...h, q });
  }
  if (ungVien.length >= 8) break;
}
if (!ungVien.length) { console.error("Không có ảnh đạt lọc. Thử từ khoá khác."); process.exit(1); }

const ds = ungVien.slice(0, 8);
ds.forEach((h, i) => console.log(`${i}  ${h.id}  ${h.user}  [${h.q}]  ${h.tags.slice(0, 90)}`));

if (XEM) {
  const tiles = await Promise.all(ds.map(async (h, i) => ({
    input: await sharp(await layAnh(h.webformatURL)).resize(300, 169, { fit: "cover" }).jpeg().toBuffer(),
    left: (i % 4) * 305, top: Math.floor(i / 4) * 174,
  })));
  const out = path.join(ROOT, `.anh-xem-${slug}.jpg`);
  await sharp({ create: { width: 1215, height: 343, channels: 3, background: "#ffffff" } })
    .composite(tiles).jpeg({ quality: 75 }).toFile(out);
  console.log("Tấm xem thử:", out, "(xoá sau khi chọn)");
  process.exit(0);
}

const h = ds[CHON];
if (!h) { console.error(`Không có ứng viên số ${CHON}`); process.exit(2); }
const dich = path.join(ROOT, `assets/blog/${slug}-hero.jpg`);
await sharp(await layAnh(h.largeImageURL)).resize(W, H, { fit: "cover", position: "centre" })
  .jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(dich);

const dong = `| \`${slug}-hero.jpg\` | [${h.id}](${h.pageURL}) | ${h.user} |`;
const BM = "## Bài mới (sau 20/11/2026)";
let moi = doc.replace(new RegExp(`^\\| \`${slug}-hero\\.jpg\` \\|.*\\n?`, "m"), "");
if (!moi.includes(BM)) moi = moi.trimEnd() + `\n\n${BM}\n\n| Ảnh | Pixabay | Người chụp |\n|---|---|---|\n`;
moi = moi.trimEnd() + "\n" + dong + "\n";
writeFileSync(DOC, moi);
console.log(`Đã ghi ${path.relative(ROOT, dich)} từ ảnh ${h.id} (${h.user}). Mở ảnh xem lại trước khi commit.`);
