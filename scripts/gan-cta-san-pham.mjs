#!/usr/bin/env node
/**
 * Gắn khối CTA sản phẩm vào các bài blog CHỈ CÓ HTML (máy viết blog trên Vercel commit thẳng
 * .html, không để lại bản .md nên `build-article.mjs --all` không chạm tới được).
 *
 * Idempotent: bài nào đã có mốc <!-- cta-san-pham --> thì bỏ qua, chạy lại không nhân đôi.
 * Chạy: node scripts/gan-cta-san-pham.mjs [--commit]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ctaSanPham, CSS_CTA_SP, MOC } from "./cta-san-pham.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");
const BLOG = path.join(ROOT, "blog");

const files = fs.readdirSync(BLOG).filter((f) => f.endsWith(".html"));
let them = 0, daCo = 0, boQua = 0;
const boQuaTen = [];

for (const f of files) {
  const p = path.join(BLOG, f);
  let html = fs.readFileSync(p, "utf8");

  if (html.includes(MOC)) { daCo++; continue; }
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
if (boQuaTen.length) console.log("  bỏ qua:", boQuaTen.slice(0, 10).join(", ") + (boQuaTen.length > 10 ? ` …+${boQuaTen.length - 10}` : ""));
if (!COMMIT) console.log("\nXem thử. Thêm --commit để ghi thật.");
