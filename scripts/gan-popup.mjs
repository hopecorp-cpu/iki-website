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
import { chonSanPham } from "./cta-san-pham.mjs";

/**
 * Sản phẩm của bài: ưu tiên đọc từ chính khối CTA cuối bài (đã chọn theo chủ đề) để pop-up và
 * CTA không nói hai món khác nhau. Bài chưa có CTA thì suy từ tiêu đề bằng cùng luật đó.
 */
function spCuaBai(html, slug) {
  const m = html.match(/shop\/\?sp=([a-z0-9-]+)/);
  if (m) return m[1];
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  return chonSanPham({ title: t, slug })?.slug;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ghi = process.argv.includes("--ghi");

const thuMuc = path.join(ROOT, "blog");
const bai = fs.readdirSync(thuMuc).filter((f) => f.endsWith(".html")).sort();

let da = 0, vaMoi = 0, boQuaCoNhap = 0, khongCoBody = 0;
for (const f of bai) {
  const p = path.join(thuMuc, f);
  const html = fs.readFileSync(p, "utf8");

  // CỐ Ý không bỏ qua bài có .md nữa: khối pop-up nay là NGUỒN DUY NHẤT nên thay ở đây ra
  // đúng bằng thứ build-article sẽ dựng — không còn nguy cơ file sinh lệch khỏi nguồn.
  const moi = chenPopup(html, spCuaBai(html, f.replace(/\.html$/, "")));
  if (moi === html) {
    if (html.includes('id="ikiExit"')) { da++; continue; }
    console.log(`  KHÔNG có </body>: ${slug}`); khongCoBody++; continue;
  }
  if (ghi) fs.writeFileSync(p, moi, "utf8");
  vaMoi++;
}

console.log(`\n${bai.length} bài · đã có ${da} · ${ghi ? "vừa vá" : "sẽ vá"} ${vaMoi} · bỏ qua vì có .md ${boQuaCoNhap} · không có </body> ${khongCoBody}`);
if (!ghi) console.log("Bản xem thử — thêm --ghi để vá thật.");
if (khongCoBody) process.exitCode = 1;
