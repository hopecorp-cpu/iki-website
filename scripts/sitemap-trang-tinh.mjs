#!/usr/bin/env node
/**
 * sitemap-trang-tinh.mjs — KHAI BA BẢN NGÔN NGỮ CỦA TRANG TĨNH VÀO SITEMAP.
 *
 * Vì sao có (13/10/2026): sitemap.xml đang khai tay phần trang tĩnh, nên 10 trang pháp lý mới chỉ
 * có 2 trang nằm trong đó, và 28 bản dịch en/ja vừa dựng thì không trang nào được khai. Google không
 * biết ba bản là MỘT trang nếu thiếu cụm hreflang, nên dễ coi bản tiếng Anh là bản trùng lặp.
 *
 * Máy này CHỈ đụng vùng trang tĩnh (trang .html ở gốc repo và bản dịch của chúng):
 *   - trang nào CHƯA có <loc> thì thêm một khối <url> mới trước </urlset>;
 *   - trang nào ĐÃ có thì chỉ chèn/cập nhật cụm <xhtml:link hreflang>, không đổi lastmod/priority.
 * KHÔNG đụng vùng blog (build-structure.mjs lo), không đụng /shop/, /quiz/, /tai-lieu/, /san-pham/.
 * 404 cố ý không khai: trang lỗi không được vào chỉ mục.
 *
 * Chạy:  node scripts/sitemap-trang-tinh.mjs [--thu]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ikihealing.com";
const THU = process.argv.includes("--thu");
const NGONS = ["vi", "en", "ja"];
const KHONG_KHAI = new Set(["404.html", "coming-soon.html"]);

const duong = (ngon, ten) => {
  const goc = ten === "index.html" ? "/" : `/${ten}`;
  return ngon === "vi" ? goc : `/${ngon}${goc}`;
};
const coTrang = (ngon, ten) => fs.existsSync(path.join(ROOT, ngon === "vi" ? "" : ngon, ten));

const sp = path.join(ROOT, "sitemap.xml");
let xml = fs.readFileSync(sp, "utf8");
const dangCo = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));

const tenTrang = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html") && !KHONG_KHAI.has(f)).sort();
const homNay = new Date().toISOString().slice(0, 10);
const them = [];
let suaHreflang = 0;

for (const ten of tenTrang) {
  const ban = NGONS.filter((l) => coTrang(l, ten));
  if (ban.length < 2) continue; // chỉ có bản Việt thì không cần cụm hreflang
  const cum = ban.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${duong(l, ten)}" />`)
    .concat([`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${duong("vi", ten)}" />`]).join("\n");
  for (const l of ban) {
    const loc = `${SITE}${duong(l, ten)}`;
    if (!dangCo.has(loc)) {
      them.push(`<url>\n    <loc>${loc}</loc>\n    <lastmod>${homNay}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n${cum}\n  </url>`);
      continue;
    }
    // đã có: thay cụm hreflang cũ trong ĐÚNG khối <url> đó, giữ nguyên lastmod/changefreq/priority
    const re = new RegExp(`(<url>(?:(?!</url>)[\\s\\S])*?<loc>${loc.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}</loc>(?:(?!</url>)[\\s\\S])*?)</url>`);
    const m = re.exec(xml);
    if (!m) continue;
    const than = m[1].replace(/\n?\s*<xhtml:link[^>]*>/g, "");
    const moi = `${than.replace(/\s*$/, "\n")}${cum}\n  </url>`;
    if (moi !== m[0]) { xml = xml.replace(m[0], moi); suaHreflang++; }
  }
}

if (them.length) xml = xml.replace(/\n?<\/urlset>/, `\n${them.map((x) => "  " + x).join("\n")}\n</urlset>`);
const bc = `thêm ${them.length} địa chỉ, cập nhật hreflang cho ${suaHreflang} địa chỉ sẵn có`;
if (THU) { console.log(`[thử] ${bc} (không ghi)`); process.exit(0); }
fs.writeFileSync(sp, xml);
console.log(`sitemap.xml: ${bc}`);
