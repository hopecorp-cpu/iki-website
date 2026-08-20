#!/usr/bin/env node
/**
 * Chèn khối CẦU NỐI vào bài chỉ có HTML (không có bản nháp .md để dựng lại).
 *
 * Máy viết blog trên Vercel commit thẳng HTML nên 11 trong 37 bài đã vào chỉ mục không có nháp.
 * Chúng vẫn là CỬA cho Googlebot nên vẫn phải có khối cầu nối — nhưng khối chèn tay sẽ MẤT nếu
 * về sau ai đó dựng lại bài từ nguồn khác. Script nói rõ điều đó thay vì im lặng.
 *
 * Idempotent theo mốc <!-- cau-noi -->; chạy lại không nhân đôi.
 * Chạy: node scripts/gan-cau-noi.mjs [--commit]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { khoiCauNoi, CSS_CAU_NOI } from "./cau-noi-chi-muc.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");
const MOC = "<!-- cau-noi -->";

const { daLap = [] } = JSON.parse(fs.readFileSync(path.join(ROOT, "chi-muc-map.json"), "utf8"));
const chiHtml = daLap.filter((s) => !fs.existsSync(path.join(ROOT, "blog-drafts", `${s}.md`)));

let them = 0, daCo = 0, hong = [];
for (const slug of chiHtml) {
  const p = path.join(ROOT, "blog", `${slug}.html`);
  if (!fs.existsSync(p)) { hong.push(`${slug} (không thấy file)`); continue; }
  let html = fs.readFileSync(p, "utf8");
  if (html.includes(MOC) || html.includes('class="cau-noi"')) { daCo++; continue; }

  const khoi = khoiCauNoi(slug);
  if (!khoi) { hong.push(`${slug} (không có phần bài để dẫn)`); continue; }

  // Chèn TRƯỚC khối CTA sản phẩm nếu có, không thì trước khối CTA email, không nữa thì cuối thân bài.
  const neo = ["<!-- cta-san-pham -->", '<div class="post-cta">', "</article>"].find((n) => html.includes(n));
  if (!neo) { hong.push(`${slug} (không có chỗ chèn)`); continue; }
  html = html.replace(neo, `${MOC}\n        ${khoi}\n\n        ${neo}`);
  if (!html.includes(".cau-noi{")) html = html.replace("</head>", `<style>${CSS_CAU_NOI}</style>\n</head>`);

  if (COMMIT) fs.writeFileSync(p, html);
  them++;
}
console.log(`Bài chỉ có HTML: ${chiHtml.length} · chèn thêm: ${them} · đã có sẵn: ${daCo}`);
if (hong.length) console.log("Không chèn được:", hong.join(" · "));
if (!COMMIT) console.log("\nXem thử. Thêm --commit để ghi thật.");
if (them) console.log("LƯU Ý: khối chèn tay này sẽ MẤT nếu bài được dựng lại từ nguồn khác (bài không có nháp .md).");
