#!/usr/bin/env node
/**
 * CHỐT CHẶN build (MKT-06 lô B, TH duyệt 03/10/2026): bài blog nào (thân bài, thẻ, chân trang —
 * tức cả file) còn "Tuệ Minh", "Tue Minh", tra.ikihealing.com hoặc "Trà Thảo Dược 5 Vị" thì build LỖI.
 * Quét blog/**, en/blog/**, ja/blog/**, blog-drafts/**. Bỏ qua trang chuyển hướng (có
 * http-equiv="refresh") và bài có slug trong chuyen-huong.json (đã gỡ bằng chuyển hướng).
 * Không tự sửa chữ: chỉ in danh sách file trúng để người viết sửa.
 * Chạy: node scripts/chan-tue-minh.mjs   (gọi trong .github/workflows/build-blog.yml)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAM = /tuệ minh|tue minh|(?<![a-z0-9.-])tra\.ikihealing\.com|trà thảo dược 5 vị/i;
const fileCH = path.join(ROOT, "chuyen-huong.json");
const DA_CHUYEN = new Set(fs.existsSync(fileCH) ? Object.keys(JSON.parse(fs.readFileSync(fileCH, "utf8"))) : []);

function* duyet(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* duyet(p);
    else if (/\.(html|md)$/.test(e.name)) yield p;
  }
}

const trung = [];
let boQua = 0;
for (const thu of ["blog", "en/blog", "ja/blog", "blog-drafts"]) {
  for (const p of duyet(path.join(ROOT, thu))) {
    const chu = fs.readFileSync(p, "utf8").normalize("NFC");
    if (!CAM.test(chu)) continue;
    if (/http-equiv=["']refresh["']/i.test(chu) || DA_CHUYEN.has(path.basename(p).replace(/\.(html|md)$/, ""))) { boQua++; continue; }
    const dong = chu.split("\n").findIndex((l) => CAM.test(l)) + 1;
    trung.push(`${path.relative(ROOT, p)}:${dong}`);
  }
}
if (trung.length) {
  console.error(`CHỐT CHẶN Tuệ Minh: ${trung.length} file còn chữ cấm (bỏ qua ${boQua} trang đã chuyển hướng):`);
  for (const t of trung) console.error("  " + t);
  process.exit(1);
}
console.log(`Chốt chặn Tuệ Minh: sạch (bỏ qua ${boQua} trang đã chuyển hướng).`);
