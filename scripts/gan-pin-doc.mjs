#!/usr/bin/env node
/**
 * gan-pin-doc.mjs — Vá thẻ og:image DỌC (ảnh pin Pinterest) vào HTML bài blog ĐÃ DỰNG.
 *
 * Vá gốc nằm ở build-article.mjs (qua pin-bai.mjs) nên bài có bản nháp .md sẽ tự mang thẻ này
 * ở mọi lượt dựng lại. Script này lo hai ca còn lại:
 *   - bài đã dựng từ trước mà chưa muốn dựng lại toàn bộ;
 *   - bài KHÔNG có bản nháp .md (máy viết blog trên Vercel commit thẳng HTML) — với các bài đó
 *     khối chèn tay này sẽ MẤT nếu bài bị dựng lại từ nguồn khác, script nói rõ chứ không im.
 *
 * Idempotent: bài đã có đường dẫn assets/pin/<slug>-pin-1.jpg trong head thì bỏ qua.
 * Chèn ĐÚNG chỗ build-article chèn (ngay sau twitter:image) để bản vá và bản dựng lại
 * không lệch nhau một ký tự — lệch là mỗi lượt build đẻ một diff rác.
 *
 * Dùng: node scripts/gan-pin-doc.mjs   (đọc pin-index.json ở gốc repo)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pinIndex = JSON.parse(fs.readFileSync(path.join(ROOT, "pin-index.json"), "utf8"));

let vaMoi = 0, daCo = 0, khongThay = 0, khongMd = [];
for (const { slug, anh } of pinIndex) {
  const p = path.join(ROOT, "blog", `${slug}.html`);
  if (!fs.existsSync(p)) { console.warn(`  không thấy blog/${slug}.html`); khongThay++; continue; }
  let html = fs.readFileSync(p, "utf8");
  if (html.includes(anh)) { daCo++; continue; }
  const khoi = `\n  <meta property="og:image" content="https://ikihealing.com/${anh}" />\n  <meta property="og:image:width" content="1000" />\n  <meta property="og:image:height" content="1500" />`;
  const moc = html.match(/<meta name="twitter:image"[^>]*\/>/);
  if (moc) html = html.replace(moc[0], moc[0] + khoi);
  else html = html.replace("</head>", `${khoi}\n</head>`);
  fs.writeFileSync(p, html);
  vaMoi++;
  if (!fs.existsSync(path.join(ROOT, "blog-drafts", `${slug}.md`))) khongMd.push(slug);
}
console.log(`Đã vá ${vaMoi} bài · đã có sẵn ${daCo} · không thấy file ${khongThay}`);
if (khongMd.length) {
  console.log(`LƯU Ý: ${khongMd.length} bài KHÔNG có bản nháp .md — khối og dọc sẽ mất nếu bài bị dựng lại từ nguồn khác, khi đó chạy lại script này:`);
  khongMd.forEach((s) => console.log(`  ${s}`));
}
