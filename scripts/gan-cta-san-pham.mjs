#!/usr/bin/env node
/**
 * Gắn khối CTA sản phẩm vào các bài blog CHỈ CÓ HTML (máy viết blog trên Vercel commit thẳng
 * .html, không để lại bản .md nên `build-article.mjs --all` không chạm tới được).
 *
 * Idempotent: bài nào đã có mốc <!-- cta-san-pham --> thì bỏ qua, chạy lại không nhân đôi.
 * --lam-moi: dựng lại khối đã có theo luật hiện hành của cta-san-pham.mjs (MKT-06 lô B: bỏ thẻ
 *   Tuệ Minh, nhãn trà L1, giá từ API, không thẻ ở bài tình trạng sức khoẻ). Bài không còn hợp
 *   thẻ nào thì giữ mốc, bỏ khối — chạy lại không gắn lại.
 * Chạy: node scripts/gan-cta-san-pham.mjs [--lam-moi] [--commit]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ctaSanPham, chonSanPham, CSS_CTA_SP, MOC } from "./cta-san-pham.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");
const LAM_MOI = process.argv.includes("--lam-moi");
const BLOG = path.join(ROOT, "blog");

const files = fs.readdirSync(BLOG).filter((f) => f.endsWith(".html"));
let them = 0, daCo = 0, boQua = 0, lamMoi = 0;
const boThe = [], demThe = {};
const boQuaTen = [];
const p0 = (f) => path.join(BLOG, f);

for (const f of files) {
  const p = path.join(BLOG, f);
  let html = fs.readFileSync(p, "utf8");

  if (html.includes(MOC) && LAM_MOI) {
    const fm = {
      slug: f.replace(/\.html$/, ""),
      title: (html.match(/<h1[^>]*class="post-title"[^>]*>([^<]*)/) || [])[1] || "",
      description: (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "",
    };
    const re = new RegExp(MOC + "(\\s*<aside class=\"cta-sp\"[\\s\\S]*?</aside>)?");
    const cu = html.match(re);
    let khoi = ctaSanPham(fm);
    // Giữ câu thận trọng viết thêm sau mô tả chuẩn ở thẻ cũ (vd "Mẹ đang cho con bú nên hỏi ý kiến bác sĩ…").
    const moCu = ((cu[1] || "").match(/<p class="cta-sp-mo">([\s\S]*?)<\/p>/) || [])[1] || "";
    const p = chonSanPham(fm);
    if (khoi && p && moCu.startsWith(p.moTa) && moCu.length > p.moTa.length) {
      const them = moCu.slice(p.moTa.length);
      khoi = khoi.replace(/(<p class="cta-sp-mo">[\s\S]*?)(<\/p>)/, (_, a, b) => a + them + b);
    }
    if (!khoi) { boThe.push(fm.slug); khoi = MOC; }
    else demThe[p.slug] = (demThe[p.slug] || 0) + 1;
    const moi = html.replace(re, khoi);
    if (moi !== html) { lamMoi++; if (COMMIT) fs.writeFileSync(p0(f), moi); }
    daCo++; continue;
  }
  if (html.includes(MOC) || LAM_MOI) { daCo++; continue; }
  // Bài không gắn sản phẩm (no_product) không có khối post-cta — tôn trọng cờ đó, đừng ép bán.
  if (!html.includes('<div class="post-cta">')) { boQua++; boQuaTen.push(f); continue; }

  const fm = {
    slug: f.replace(/\.html$/, ""),
    title: (html.match(/<h1[^>]*class="post-title"[^>]*>([^<]*)/) || [])[1] || "",
    description: (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "",
  };

  const khoi = ctaSanPham(fm);
  html = html.replace('        <div class="post-cta">', `${khoi}\n\n        <div class="post-cta">`);
  // CSS đi kèm, chèn ngay sau luật .post-cta p đã có sẵn trong mọi bản template.
  if (!html.includes(".cta-sp{")) {
    html = html.replace(".post-cta p{margin:0 0 16px;opacity:.95}", ".post-cta p{margin:0 0 16px;opacity:.95}" + CSS_CTA_SP);
  }

  if (COMMIT) fs.writeFileSync(p, html);
  them++;
}

console.log(`Bài blog: ${files.length} · đã có sẵn: ${daCo} · gắn thêm: ${them} · bỏ qua (không gắn sản phẩm): ${boQua}`);
if (LAM_MOI) {
  console.log(`Làm mới: ${lamMoi} bài đổi · thẻ sau làm mới: ${JSON.stringify(demThe)} · bỏ thẻ (bài tình trạng sức khoẻ): ${boThe.length}`);
  if (boThe.length) console.log("  bỏ thẻ:", boThe.join(", "));
}
if (boQuaTen.length) console.log("  bỏ qua:", boQuaTen.slice(0, 10).join(", ") + (boQuaTen.length > 10 ? ` …+${boQuaTen.length - 10}` : ""));
if (!COMMIT) console.log("\nXem thử. Thêm --commit để ghi thật.");
