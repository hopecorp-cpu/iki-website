#!/usr/bin/env node
/**
 * KT-sau-2 — sửa NGUỒN và khối chữ (không dựng lại cả bài).
 * HTML bài có blog-drafts/*.md được dựng lại bằng build-article sau khi script này chạy.
 * Idempotent: chạy lần 2 không đổi byte.
 *
 * Mục 6 (dau-nanh-trong-bua-com-viet): không sửa câu TVP và không dựng lại.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cauDuyet } from "./cta-san-pham.mjs";
import { cauTheoKhoa, khoaKhuyenCao, parseSource, KHUYEN_CAO_LOCALE } from "./build-article.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BO_QUA_DUNG = new Set(["dau-nanh-trong-bua-com-viet"]);
const HUB = new Set([
  "index", "cam-on", "lo-trinh", "moi-quan-tam", "tat-ca-bai-viet", "cam-nhan-cong-dong",
  "danh-muc-bao-cao", "danh-muc-cam-nang-suc-khoe", "danh-muc-dinh-duong", "danh-muc-dong-y",
  "danh-muc-thoi-quen", "danh-muc-thuc-pham", "mien-tru-trach-nhiem",
]);

const A8_VI = cauDuyet("A8");
const A4_VI = cauDuyet("A4");

function doc(p) { return fs.readFileSync(p, "utf8"); }
function ghi(p, s) { if (doc(p) !== s) { fs.writeFileSync(p, s); return true; } return false; }

function fmTuFile(slug) {
  const p = path.join(ROOT, "blog-drafts", `${slug}.md`);
  if (!fs.existsSync(p)) return null;
  return parseSource(doc(p)).fm;
}
function fmSuy(slug, html) {
  const co = fmTuFile(slug);
  if (co) return co;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ""])[1].replace(/<[^>]+>/g, "").trim();
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, h1])[1].replace(/<[^>]+>/g, "").trim();
  return { slug, title: h1 || title, seo_title: title, keyword: "", category: "" };
}

function khoiHtml(cau) {
  return `<div class="post-disclaimer">\n          ${cau.map((c) => `<p>${c}</p>`).join("\n          ")}\n        </div>`;
}

// Câu gom mọi sản phẩm IKI thành thực phẩm bổ sung. Không ăn qua dòng — tránh đụng thụt lề.
const CAU_CU_VI = /Các sản phẩm(?: của)? IKI(?:[ \t]|<[^>\n]+>|\([^)\n]{0,200}\))*là(?:[ \t]|<[^>\n]+>)*thực phẩm bổ sung[^\n]{0,420}?\./g;
const CAU_CU_EN = /IKI(?:'s|’s)? products are(?:[ \t]|<[^>\n]+>)*(?:food\/dietary supplements|food supplements|dietary supplements)\b[^\n]{0,420}?\./gi;
const CAU_CU_JA = /IKI\s*の製品(?:\([^)\n]{0,80}\))?は[^\n。]{0,220}?健康補助食品[^\n]{0,220}?[。.]/g;

function laBai(html) {
  return /class="post-body"|<article\b/.test(html);
}

function coCauCuKhoi(inner, lang) {
  if (lang === "vi") return /Các sản phẩm(?: của)? IKI là/.test(inner) || /thực phẩm bổ sung(?:\s|<[^>]+>)*và(?:\s|<[^>]+>)*trà thảo mộc/.test(inner);
  if (lang === "en") return /IKI(?:'s|’s)? products are[\s\S]{0,160}supplement/i.test(inner);
  return /IKI\s*の製品は[\s\S]{0,80}健康補助食品/.test(inner);
}

function thayKhoi(html, lang, fm) {
  const re = /<div class="post-disclaimer">([\s\S]*?)<\/div>/;
  const m = html.match(re);
  const a8 = lang === "vi" ? A8_VI : KHUYEN_CAO_LOCALE[lang].A8;
  if (m) {
    if (coCauCuKhoi(m[1], lang)) return html.replace(re, khoiHtml(cauTheoKhoa(khoaKhuyenCao(fm), lang)));
    if (!m[1].includes(a8)) {
      return html.replace(re, (all) => all.replace(/<\/div>$/, `          <p>${a8}</p>\n        </div>`));
    }
    return html;
  }
  if (!laBai(html) || HUB.has(fm.slug)) return html;
  if (html.includes(a8)) return html;
  const khoi = khoiHtml(cauTheoKhoa(khoaKhuyenCao(fm), lang));
  if (html.includes("</article>")) return html.replace("</article>", `${khoi}\n    </article>`);
  return html;
}

function boCauCu(text, lang) {
  const re = lang === "vi" ? CAU_CU_VI : lang === "en" ? CAU_CU_EN : CAU_CU_JA;
  if (!re.test(text)) return text;
  re.lastIndex = 0;
  return text.split("\n").map((line) => {
    if (!re.test(line)) { re.lastIndex = 0; return line; }
    re.lastIndex = 0;
    let n = line.replace(re, "");
    n = n.replace(/<li>\s*<\/li>/g, "");
    n = n.replace(/([^\n\t])[ \t]{2,}/g, "$1 ").replace(/[ \t]+\*/g, "*").replace(/\* \*/g, "");
    if (/^\*+\s*$/.test(n.trim())) return "";
    if (n !== line && n.trim() === "") return "";
    return n;
  }).join("\n");
}

const dem = { md: 0, vi: 0, en: 0, ja: 0, pracEn: 0, pracJa: 0, sidebar: 0, tinh: 0 };
const dungLai = [];

// Câu gọi trà là thực phẩm bổ sung — thay bằng câu đã duyệt (đạm + A4 + A8), trước khi gỡ câu cũ.
function thayTinh(p, cu, moi) {
  if (!fs.existsSync(p)) return;
  const t = doc(p);
  if (!t.includes(cu)) return;
  if (ghi(p, t.replaceAll(cu, moi))) dem.tinh++;
}
const tvp = cauTheoKhoa(["dam"], "vi")[0];
const capVI = `${tvp} ${A4_VI} ${A8_VI}`;
const capEN = cauTheoKhoa(["dam", "thanhHuong"], "en").join(" ");
const capJA = cauTheoKhoa(["dam", "thanhHuong"], "ja").join("");
thayTinh(
  path.join(ROOT, "blog/mien-tru-trach-nhiem.html"),
  "Các sản phẩm của IKI (đạm thực vật, trà thảo mộc và các sản phẩm khác) là <strong>thực phẩm bổ sung, không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh</strong>.",
  capVI,
);
thayTinh(
  path.join(ROOT, "en/blog/mien-tru-trach-nhiem.html"),
  "IKI's products (plant protein, herbal tea, and other items) are <strong>dietary supplements, not medications, and have no effect that replaces medication for treating disease</strong>.",
  capEN,
);
thayTinh(
  path.join(ROOT, "ja/blog/mien-tru-trach-nhiem.html"),
  "IKI の製品(植物性プロテイン、ハーブティーおよびその他の製品)は<strong>健康補助食品であり、医薬品ではなく、医薬品の効能を持つものではありません</strong>。",
  capJA,
);
thayTinh(
  path.join(ROOT, "quiz/index.html"),
  "Sản phẩm của IKI là thực phẩm bổ sung và trà thảo mộc, không phải thuốc và không thay thế thuốc chữa bệnh. ",
  "",
);
thayTinh(
  path.join(ROOT, "blog/on-dinh-duong-huyet.html"),
  "Các sản phẩm là thực phẩm bổ sung và trà thảo mộc, hỗ trợ chế độ ăn cân bằng, không phải thuốc và không thay thế thuốc chữa bệnh.",
  tvp,
);
thayTinh(
  path.join(ROOT, "en/blog/mien-tru-trach-nhiem.html"),
  "content is educational, does not replace medical advice; products are dietary supplements.",
  "content is educational and does not replace medical advice.",
);
thayTinh(
  path.join(ROOT, "ja/blog/mien-tru-trach-nhiem.html"),
  "医学的アドバイスに代わるものではありません。製品は健康補助食品です。",
  "医学的アドバイスに代わるものではありません。",
);

// --- nguồn markdown: gỡ câu gom mọi sản phẩm IKI ---
for (const f of fs.readdirSync(path.join(ROOT, "blog-drafts")).filter((x) => x.endsWith(".md"))) {
  const slug = f.replace(/\.md$/, "");
  if (BO_QUA_DUNG.has(slug)) continue;
  const p = path.join(ROOT, "blog-drafts", f);
  const cu = doc(p);
  const moi = boCauCu(cu, "vi");
  if (moi !== cu) {
    fs.writeFileSync(p, moi);
    dem.md++;
    dungLai.push(slug);
  }
}

function xuLyBlog(thu, lang) {
  const dir = path.join(ROOT, thu);
  let n = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
    const slug = f.replace(/\.html$/, "");
    if (lang === "vi" && BO_QUA_DUNG.has(slug)) continue;
    const p = path.join(dir, f);
    let html = doc(p);
    const fm = fmSuy(slug, html);
    const truoc = html;
    if (!HUB.has(slug)) html = thayKhoi(html, lang, fm);
    html = boCauCu(html, lang);
    if (html !== truoc) {
      fs.writeFileSync(p, html);
      n++;
    }
  }
  return n;
}

// VI có .md sẽ được dựng lại — vẫn gỡ câu cũ trên HTML hiện tại để lần dựng khớp nguồn
// (bài không có .md chỉ sửa HTML).
dem.vi = xuLyBlog("blog", "vi");
dem.en = xuLyBlog("en/blog", "en");
dem.ja = xuLyBlog("ja/blog", "ja");

// --- practitioner / 漢方医 = lương y, cùng câu đã duyệt ở PR #23. Giữ "yoga practitioners". ---
const EN_CU = "see a qualified traditional medicine practitioner";
const EN_MOI = "ask a doctor or a healthcare worker";
const JA_CU = "専門知識を持つ漢方医・鍼灸師";
const JA_MOI = "医師または医療従事者";
for (const f of fs.readdirSync(path.join(ROOT, "en/blog")).filter((x) => x.endsWith(".html"))) {
  const p = path.join(ROOT, "en/blog", f);
  const cu = doc(p);
  if (!cu.includes(EN_CU)) continue;
  if (ghi(p, cu.replaceAll(EN_CU, EN_MOI))) dem.pracEn++;
}
for (const f of fs.readdirSync(path.join(ROOT, "ja/blog")).filter((x) => x.endsWith(".html"))) {
  const p = path.join(ROOT, "ja/blog", f);
  const cu = doc(p);
  if (!cu.includes(JA_CU)) continue;
  if (ghi(p, cu.replaceAll(JA_CU, JA_MOI))) dem.pracJa++;
}

// --- sidebar EN/JA: bỏ câu cá nhân hoá theo thể tạng ---
const side = [
  [path.join(ROOT, "en/blog/index.html"),
    "A 30-second daily journal with suggestions tailored to your own constitution.",
    "A 30-second daily journal (optional)."],
  [path.join(ROOT, "ja/blog/index.html"),
    "1日30秒の記録で、あなたの体質に合わせた提案が届きます。",
    "1日30秒の健康日記です（任意）。"],
];
for (const [p, cu, moi] of side) {
  const t = doc(p);
  if (t.includes(cu) && ghi(p, t.replaceAll(cu, moi))) dem.sidebar++;
}

const danh = [...new Set(dungLai)].filter((s) => !BO_QUA_DUNG.has(s)).sort();
fs.writeFileSync("/tmp/kt-sau-2-dung.txt", danh.join("\n") + (danh.length ? "\n" : ""));
console.log(JSON.stringify({ ...dem, dung: danh.length }, null, 2));
