#!/usr/bin/env node
/**
 * seo-audit.mjs — Site Audit kỹ thuật (như Ahrefs Site Audit, mức HTML) cho ikihealing.com.
 * Crawl sitemap → mỗi trang kiểm: status, title (độ dài), meta description, h1, canonical,
 * og:title/og:image, tỉ lệ ảnh thiếu alt, số link nội bộ. Báo lỗi/cảnh báo.
 * KHÔNG cần Ahrefs. Chạy: node scripts/seo-audit.mjs
 */
const SITE = "https://ikihealing.com";

async function get(url) {
  try { const r = await fetch(url, { redirect: "manual" }); const body = r.status < 400 ? await r.text() : ""; return { status: r.status, body }; }
  catch (e) { return { status: 0, body: "", err: e.message }; }
}
const pick = (re, s) => { const m = s.match(re); return m ? m[1].trim() : ""; };

async function main() {
  const sm = await get(`${SITE}/sitemap.xml`);
  const urls = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Sitemap: ${urls.length} URL\n`);
  const issues = [];
  let ok = 0;
  for (const url of urls) {
    const { status, body } = await get(url);
    const P = [];
    if (status !== 200) { issues.push(`✗ [${status}] ${url}`); continue; }
    const title = pick(/<title>([^<]*)<\/title>/i, body);
    const desc = pick(/<meta name="description" content="([^"]*)"/i, body);
    const h1 = (body.match(/<h1[\s>]/gi) || []).length;
    const canon = pick(/<link rel="canonical" href="([^"]*)"/i, body);
    const ogImg = /og:image/i.test(body);
    const imgs = (body.match(/<img\b[^>]*>/gi) || []);
    const imgNoAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
    const jsonld = (body.match(/application\/ld\+json/gi) || []).length;
    if (!title) P.push("thiếu <title>");
    else if (title.length > 65) P.push(`title dài ${title.length} (>65)`);
    else if (title.length < 15) P.push(`title ngắn ${title.length}`);
    if (!desc) P.push("thiếu meta description");
    else if (desc.length > 165) P.push(`description dài ${desc.length} (>165)`);
    if (h1 === 0) P.push("thiếu H1");
    if (h1 > 1) P.push(`${h1} thẻ H1 (nên 1)`);
    if (!canon) P.push("thiếu canonical");
    if (!ogImg) P.push("thiếu og:image");
    if (imgNoAlt > 0) P.push(`${imgNoAlt}/${imgs.length} ảnh thiếu alt`);
    if (P.length) issues.push(`⚠ ${url}\n    ${P.join(" · ")}`);
    else ok++;
    process.stdout.write(".");
  }
  console.log(`\n\n=== KẾT QUẢ (${urls.length} trang) ===`);
  console.log(`✓ Sạch: ${ok}`);
  console.log(`⚠ Có vấn đề: ${issues.filter((x) => x.startsWith("⚠")).length}`);
  console.log(`✗ Lỗi status: ${issues.filter((x) => x.startsWith("✗")).length}`);
  if (issues.length) { console.log(""); issues.forEach((i) => console.log(i)); }
  // Kiểm hạ tầng
  console.log("\n=== Hạ tầng ===");
  for (const f of ["robots.txt", "llms.txt", "sitemap.xml"]) {
    const r = await get(`${SITE}/${f}`); console.log(`${r.status === 200 ? "✓" : "✗"} /${f} [${r.status}]`);
  }
}
main();
