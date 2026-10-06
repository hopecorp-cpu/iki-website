#!/usr/bin/env node
/**
 * MKT-06 lô B (TH duyệt 03/10/2026, T1): sửa khối "Sản phẩm & công cụ" (section.brand-box) ở các
 * bài blog ĐÃ XUẤT BẢN (VI/EN/JA) — không dựng lại bài, chỉ thay đúng trong khối này:
 *  - bỏ dòng sản phẩm (link tra.ikihealing.com / thanhhuongtra / trueveganprotein): khối chung không nêu tên sản phẩm;
 *  - bỏ ngoặc "(3 Ngày Reset · 7 Ngày Detox)" và các bản dịch;
 *  - VI: tiêu đề + aria-label = câu T1 đã duyệt (kiểm băm). EN/JA: chưa có câu dịch đã duyệt → giữ tiêu đề.
 * Idempotent. Chạy: node scripts/sua-khoi-cong-cu.mjs [--commit]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cauDuyet } from "./cta-san-pham.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");
const T1 = cauDuyet("T1").replace(/&/g, "&amp;");
const dem = {};

for (const thu of ["blog", "en/blog", "ja/blog"]) {
  const dir = path.join(ROOT, thu);
  let doi = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
    const p = path.join(dir, f);
    const cu = fs.readFileSync(p, "utf8");
    const moi = cu.replace(/<section class="brand-box"[\s\S]*?<\/section>/g, (khoi) => {
      let k = khoi
        .replace(/\n?[ \t]*<li>(?:(?!<\/li>)[\s\S])*?(?:tra\.ikihealing\.com|thanhhuongtra\.ikihealing\.com|trueveganprotein\.com)[\s\S]*?<\/li>/g, "")
        .replace(/\s*[（(][^（）()]*?(?:Detox|デトックス|Refresh)[^（）()]*?[）)]/g, "");
      if (thu === "blog") {
        k = k.replace('<h2>Sản phẩm &amp; công cụ IKI Healing</h2>', `<h2>${T1}</h2>`)
          .replace('aria-label="Sản phẩm và công cụ IKI"', `aria-label="${T1}"`);
      }
      return k;
    });
    if (moi !== cu) { doi++; if (COMMIT) fs.writeFileSync(p, moi); }
  }
  dem[thu] = doi;
}
console.log("Khối công cụ — số bài đổi:", JSON.stringify(dem));
if (!COMMIT) console.log("Xem thử. Thêm --commit để ghi thật.");
