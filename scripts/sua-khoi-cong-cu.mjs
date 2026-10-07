#!/usr/bin/env node
/**
 * MKT-06 lô B (TH duyệt 03/10/2026, T1): sửa khối "Sản phẩm & công cụ" (section.brand-box) ở các
 * bài blog ĐÃ XUẤT BẢN (VI/EN/JA) — không dựng lại bài, chỉ thay đúng trong khối này:
 *  - bỏ dòng sản phẩm (link tra.ikihealing.com / thanhhuongtra / trueveganprotein): khối chung không nêu tên sản phẩm;
 *  - bỏ ngoặc "(3 Ngày Reset · 7 Ngày Detox)" và các bản dịch;
 *  - VI: tiêu đề + aria-label = câu T1 đã duyệt (kiểm băm).
 *  - EN/JA: TH CHỐT 06/10/2026 CC-1/CC-1b — tiêu đề có Products/製品/商品 + aria-label → "IKI Beauty & Wellness Tools" /
 *    "IKI Beauty & Wellness のツール"; mọi dòng <li> có link app.html → nguyên văn
 *    "IKI App — a personalized health journal (optional)." / "IKIアプリ — パーソナライズされた健康日記(任意)。". Tiêu đề riêng khác giữ nguyên.
 *  - EN/JA announcement-bar và post-cta còn "AI Eastern … Coach" / "東洋医学AIコーチ" (KT-sau-1, TH CC-1b):
 *    thay bằng "IKI App — a personalized health journal (optional)." /
 *    "IKIアプリ — パーソナライズされた健康日記(任意)。". Giữ href app.html sẵn có.
 *  - VI, chỉ 3 bài thẻ trà đã xuất bản không có blog-drafts/*.md (KT-sau-1): dòng <li> app.html trong
 *    brand-box, announcement-bar và post-cta còn câu "đang phát triển" → đúng câu khuôn bài có .md
 *    "App IKI — nhật ký sức khoẻ cá nhân hoá (tuỳ chọn).". Giữ href app.html sẵn có. Bài VI khác
 *    còn câu cũ thuộc KT-sau-2 — không đụng (PR S1–S12 xếp chồng trên nhánh này).
 * Idempotent. Chạy: node scripts/sua-khoi-cong-cu.mjs [--commit]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cauDuyet } from "./cta-san-pham.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");
const T1 = cauDuyet("T1").replace(/&/g, "&amp;");
// Ba bài thẻ trà xuất bản thẳng HTML, không có blog-drafts/*.md, còn câu app cũ.
const VI_KHONG_MD = new Set([
  "do-uong-co-gas-va-suc-khoe.html",
  "tra-thanh-huong-la-gi.html",
  "uong-tra-dung-cach.html",
]);
const CAU_APP_VI = "App IKI — nhật ký sức khoẻ cá nhân hoá (tuỳ chọn).";
const CO_APP_CU_VI = /Ứng dụng IKI Beauty|đang phát triển|Đang phát triển/;
const dem = {};
// EN/JA (TH CC-1b): mọi <li> có link app.html → đúng nguyên văn câu đích, giữ thẻ <a> cũ (href/target/rel).
const dongApp = (li, duoi) => {
  const a = li.match(/<a [^>]*app\.html[^>]*>/);
  return a ? `<li>${a[0]}${duoi}</li>` : li;
};

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
        // Cùng câu App IKI mà build-article gắn cho bài có .md. Chỉ 3 slug không có nguồn .md.
        if (VI_KHONG_MD.has(f)) {
          k = k.replace(/<li>(?:(?!<\/li>)[\s\S])*?<\/li>/g, (li) => dongApp(li, "App IKI</a> — nhật ký sức khoẻ cá nhân hoá (tuỳ chọn)."));
        }
      } else if (thu === "en/blog") {
        k = k.replace(/<h2>[^<]*[Pp]roducts[^<]*<\/h2>/g, "<h2>IKI Beauty &amp; Wellness Tools</h2>")
          .replace(/aria-label="(?:IKI products and tools|Sản phẩm và công cụ IKI)"/g, 'aria-label="IKI Beauty &amp; Wellness Tools"')
          .replace(/<li>(?:(?!<\/li>)[\s\S])*?<\/li>/g, (li) => dongApp(li, "IKI App</a> — a personalized health journal (optional)."));
      } else {
        k = k.replace(/<h2>[^<]*(?:製品|商品)[^<]*<\/h2>/g, "<h2>IKI Beauty &amp; Wellness のツール</h2>")
          .replace(/aria-label="IKI ?の(?:製品|商品)とツール"/g, 'aria-label="IKI Beauty &amp; Wellness のツール"')
          .replace(/<li>(?:(?!<\/li>)[\s\S])*?<\/li>/g, (li) => dongApp(li, "IKIアプリ</a> — パーソナライズされた健康日記(任意)。"));
      }
      return k;
    });
    if (moi !== cu) { doi++; if (COMMIT) fs.writeFileSync(p, moi); }
  }
  dem[thu] = doi;
}
console.log("Khối công cụ — số bài đổi:", JSON.stringify(dem));

// KT-sau-1 / TH CC-1b: announcement-bar và post-cta EN/JA. Không đụng câu dietary supplements của trao-nguoc-da-day.
const COACH_EN = /AI Eastern (?:Wellness|Medicine) Coach|Eastern(?:[-\s]medicine)? AI Coach|AI Traditional Medicine Coach|Traditional Medicine AI Coach/i;
const CAU_APP_EN = "IKI App — a personalized health journal (optional).";
const CAU_APP_JA = "IKIアプリ — パーソナライズされた健康日記(任意)。";
function thayCoach(html, lang) {
  const co = (s) => (lang === "en" ? COACH_EN.test(s) : s.includes("東洋医学AIコーチ"));
  let out = html.replace(/<div class="announcement-bar">([\s\S]*?)<\/div>/g, (all, inner) => {
    if (!co(inner)) return all;
    const open = inner.match(/<a\b[^>]*>/);
    if (!open) return all;
    const cau = lang === "en" ? `${open[0]}IKI App</a> — a personalized health journal (optional).` : `${open[0]}IKIアプリ</a> — パーソナライズされた健康日記(任意)。`;
    const pad = (inner.match(/\n([ \t]+)/) || [, ""])[1];
    const tail = (inner.match(/\n([ \t]*)$/) || [, ""])[1];
    const prefix = pad ? `\n${pad}` : "";
    const suffix = inner.includes("\n") ? `\n${tail}` : "";
    return `<div class="announcement-bar">${prefix}${cau}${suffix}</div>`;
  });
  out = out.replace(/<div class="post-cta">([\s\S]*?)<\/div>/g, (block) => block.replace(/<p>[\s\S]*?<\/p>/g, (p) => {
    if (!co(p)) return p;
    return `<p>${lang === "en" ? CAU_APP_EN : CAU_APP_JA}</p>`;
  }));
  if (lang === "en") out = out.replaceAll("Your personalized Eastern medicine AI coach", CAU_APP_EN);
  else out = out.replaceAll("あなた専属の東洋医学AIコーチ", CAU_APP_JA);
  return out;
}
const demCoach = {};
for (const [thu, lang] of [["en/blog", "en"], ["ja/blog", "ja"]]) {
  const dir = path.join(ROOT, thu);
  let doi = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
    const p = path.join(dir, f);
    const cu = fs.readFileSync(p, "utf8");
    const moi = thayCoach(cu, lang);
    if (moi !== cu) { doi++; if (COMMIT) fs.writeFileSync(p, moi); }
  }
  demCoach[thu] = doi;
}
console.log("Announcement/CTA Coach — số trang đổi:", JSON.stringify(demCoach));

// KT-sau-1: announcement-bar và post-cta VI của 3 bài không .md. Cùng cách EN/JA: giữ <a>, đổi câu.
function thayAppVi(html) {
  let out = html.replace(/<div class="announcement-bar">([\s\S]*?)<\/div>/g, (all, inner) => {
    if (!CO_APP_CU_VI.test(inner)) return all;
    const open = inner.match(/<a\b[^>]*>/);
    if (!open) return all;
    const cau = `${open[0]}App IKI</a> — nhật ký sức khoẻ cá nhân hoá (tuỳ chọn).`;
    const pad = (inner.match(/\n([ \t]+)/) || [, ""])[1];
    const tail = (inner.match(/\n([ \t]*)$/) || [, ""])[1];
    const prefix = pad ? `\n${pad}` : "";
    const suffix = inner.includes("\n") ? `\n${tail}` : "";
    return `<div class="announcement-bar">${prefix}${cau}${suffix}</div>`;
  });
  out = out.replace(/<div class="post-cta">([\s\S]*?)<\/div>/g, (block) => block.replace(/<p>[\s\S]*?<\/p>/g, (p) => {
    if (!CO_APP_CU_VI.test(p)) return p;
    return `<p>${CAU_APP_VI}</p>`;
  }));
  return out;
}
const dirVi = path.join(ROOT, "blog");
let doiVi = 0;
for (const f of VI_KHONG_MD) {
  const p = path.join(dirVi, f);
  const cu = fs.readFileSync(p, "utf8");
  const moi = thayAppVi(cu);
  if (moi !== cu) { doiVi++; if (COMMIT) fs.writeFileSync(p, moi); }
}
console.log("Announcement/CTA VI không .md — số trang đổi:", doiVi);
if (!COMMIT) console.log("Xem thử. Thêm --commit để ghi thật.");
