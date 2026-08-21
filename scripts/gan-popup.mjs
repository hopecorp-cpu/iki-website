#!/usr/bin/env node
/**
 * gan-popup.mjs — vá pop-up thu email vào các bài blog CHỈ CÓ HTML (không có bản nháp .md).
 *
 * Vì sao cần: có hai đường sinh bài. Bài dựng từ blog-drafts/*.md đi qua build-article.mjs
 * nên đã có pop-up; bài do máy viết blog trên Vercel commit thẳng .html thì không.
 * Đo 20/08/2026: 277/392 bài có pop-up, 115 bài thiếu — và cả 115 đều không có .md.
 *
 * Chạy:  node scripts/gan-popup.mjs            (chỉ xem)
 *        node scripts/gan-popup.mjs --ghi      (vá thật)
 *
 * Idempotent: nhận diện bằng id ikiExit nên chạy lại bao nhiêu lần cũng không chèn đôi.
 * Bài CÓ .md thì KHÔNG đụng — để build-article.mjs lo, vá tay ở đây là để file sinh
 * lệch khỏi nguồn sinh ra nó và lượt dựng sau ghi đè mất.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chenPopup } from "./popup-thu-email.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ghi = process.argv.includes("--ghi");

const thuMuc = path.join(ROOT, "blog");
const bai = fs.readdirSync(thuMuc).filter((f) => f.endsWith(".html")).sort();

let da = 0, vaMoi = 0, boQuaCoNhap = 0, khongCoBody = 0;
for (const f of bai) {
  const p = path.join(thuMuc, f);
  const html = fs.readFileSync(p, "utf8");
  if (html.includes('id="ikiExit"')) { da++; continue; }

  const slug = f.replace(/\.html$/, "");
  if (fs.existsSync(path.join(ROOT, "blog-drafts", `${slug}.md`))) {
    // Có nháp mà vẫn thiếu pop-up nghĩa là bài chưa dựng lại sau khi template đổi.
    console.log(`  bỏ qua (có .md, hãy chạy build-article): ${slug}`);
    boQuaCoNhap++; continue;
  }
  const moi = chenPopup(html);
  if (moi === html) { console.log(`  KHÔNG có </body>: ${slug}`); khongCoBody++; continue; }
  if (ghi) fs.writeFileSync(p, moi, "utf8");
  vaMoi++;
}

console.log(`\n${bai.length} bài · đã có ${da} · ${ghi ? "vừa vá" : "sẽ vá"} ${vaMoi} · bỏ qua vì có .md ${boQuaCoNhap} · không có </body> ${khongCoBody}`);
if (!ghi) console.log("Bản xem thử — thêm --ghi để vá thật.");
if (khongCoBody) process.exitCode = 1;
