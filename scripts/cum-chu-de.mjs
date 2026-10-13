#!/usr/bin/env node
/**
 * CỤM CHỦ ĐỀ (Chiến dịch Phủ Google GĐ2, CEO 13/10/2026) — nối bài vệ tinh với TRANG TRỤ của cụm.
 *
 * VÌ SAO: Google xếp hạng theo độ phủ chủ đề. Bài lẻ cùng chủ đề mà không link nhau thì Google thấy 400 bài rời
 * rạc; nối thành cụm (vệ tinh -> trụ, trụ -> mọi vệ tinh) thì trang trụ gom được sức của cả cụm.
 *
 * Bản đồ ở cum-chu-de.json tại gốc repo. Script GHI THẲNG vào blog/<slug>.html (đa số bài cũ không có .md nên
 * không đi qua build-article), giữa hai dấu <!--cum-chu-de:start--> ... <!--cum-chu-de:end-->. Chạy lại bao
 * nhiêu lần cũng ra một trang y hệt; CI chạy sau build-article để bài dựng lại từ .md có lại khối.
 *
 * Chạy: node scripts/cum-chu-de.mjs [--kiem]   (--kiem: chỉ báo trang nào lệch, không ghi; lệch thì thoát 1)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KIEM = process.argv.includes("--kiem");
const DAU = "<!--cum-chu-de:start-->", CUOI = "<!--cum-chu-de:end-->";
const STYLE = "margin:30px 0;padding:18px 22px;border:1px solid #E3EADF;border-radius:8px;background:#F7F8FA";
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const tep = (slug) => path.join(ROOT, "blog", `${slug}.html`);
function ten(slug) {
  const h = fs.readFileSync(tep(slug), "utf8");
  const m = h.match(/<h1[^>]*class="post-title"[^>]*>([\s\S]*?)<\/h1>/) || h.match(/<title>([\s\S]*?)<\/title>/);
  return m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
}

function khoi(slug, cum) {
  if (slug === cum.tru) {
    const li = cum.ve_tinh.map((s) => `<li><a href="${s}.html">${esc(ten(s))}</a></li>`).join("");
    return `${DAU}<aside class="cum-chu-de" aria-label="Trọn bộ chủ đề" style="${STYLE}"><h2 style="margin:0 0 10px;font-size:1.15rem">Trọn bộ chủ đề: ${esc(cum.ten)}</h2><ul style="margin:0;padding-left:20px;line-height:1.6">${li}</ul></aside>${CUOI}`;
  }
  return `${DAU}<aside class="cum-chu-de" aria-label="Chủ đề của bài" style="${STYLE}"><p style="margin:0">Bài này thuộc chủ đề <strong>${esc(cum.ten)}</strong>. Đọc bài tổng hợp: <a href="${cum.tru}.html">${esc(ten(cum.tru))}</a>.</p></aside>${CUOI}`;
}

const MOC = ['<div class="post-cta">', '<section class="post-faq"', '<section class="post-related"'];
function chen(html, k) {
  const bo = html.replace(new RegExp(`[ \\t]*${DAU}[\\s\\S]*?${CUOI}\\n?`), "");
  for (const m of MOC) {
    const i = bo.indexOf(m);
    if (i >= 0) {
      const dau = bo.lastIndexOf("\n", i) + 1, thut = bo.slice(dau, i);
      return bo.slice(0, dau) + thut + k + "\n" + bo.slice(dau);
    }
  }
  return null;
}

const ban = JSON.parse(fs.readFileSync(path.join(ROOT, "cum-chu-de.json"), "utf8"));
let ghi = 0, lech = [], loi = [];
const da = new Set();
for (const [ma, cum] of Object.entries(ban)) {
  if (ma.startsWith("_")) continue;
  for (const slug of [cum.tru, ...cum.ve_tinh]) {
    if (da.has(slug)) { loi.push(`${slug} nằm ở hai cụm`); continue; }
    da.add(slug);
    if (!fs.existsSync(tep(slug))) { loi.push(`thiếu blog/${slug}.html`); continue; }
    const cu = fs.readFileSync(tep(slug), "utf8");
    if (/http-equiv="refresh"/.test(cu)) { loi.push(`${slug} là trang chuyển hướng`); continue; }
    const moi = chen(cu, khoi(slug, cum));
    if (moi == null) { loi.push(`${slug}: không tìm thấy chỗ chèn`); continue; }
    if (moi === cu) continue;
    lech.push(slug);
    if (!KIEM) { fs.writeFileSync(tep(slug), moi); ghi++; }
  }
}
for (const l of loi) console.error("  ! " + l);
console.log(`Cụm chủ đề: ${da.size} bài trong bản đồ, ${KIEM ? `${lech.length} bài lệch` : `ghi ${ghi} bài`}.`);
if (loi.length || (KIEM && lech.length)) process.exit(1);
