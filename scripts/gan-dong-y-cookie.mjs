#!/usr/bin/env node
/**
 * gan-dong-y-cookie.mjs — chèn khối Google Consent Mode v2 (mặc định DENIED) + thanh đồng ý cookie
 * vào MỌI trang .html của repo (kể cả en/ và ja/), trừ node_modules và ba trang chính sách đang
 * được người khác sửa (chinh-sach-bao-mat · du-lieu-su-dung · quyen-du-lieu).
 *
 * Vì sao (NĐ 330/2026): GA4 / Google Ads / Meta pixel theo dõi hành vi phải có đồng ý trước.
 * Khối consent default PHẢI đứng TRƯỚC mọi thẻ gtag/GTM nên chèn NGAY SAU <head>; trang không có
 * thẻ <head> (shop/index.html viết tắt) thì chèn ngay sau <html ...>.
 *
 * Chạy:  node scripts/gan-dong-y-cookie.mjs          (chỉ xem)
 *        node scripts/gan-dong-y-cookie.mjs --ghi    (ghi thật)
 * Idempotent: nhận diện bằng id="iki-consent-default", có rồi thì không chèn đôi.
 * Bài mới do máy sinh đã có sẵn khối này trong template (build-article / build-san-pham /
 * build-structure / build-tailieu) — script này chỉ vá trang đã có trên đĩa.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ghi = process.argv.includes("--ghi");
const MOC = 'id="iki-consent-default"';
const BO_QUA = new Set(["chinh-sach-bao-mat.html", "du-lieu-su-dung.html", "quyen-du-lieu.html"]);

export function khoiConsent(lang = "vi") {
  return `<script id="iki-consent-default">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});</script><script src="/assets/dong-y-cookie.js" defer data-lang="${lang}"></script>`;
}

/** Chèn khối vào một trang; trả về html mới, hoặc null nếu không tìm được chỗ chèn. */
export function chenConsent(html, lang = "vi") {
  if (html.includes(MOC)) return html;
  const khoi = khoiConsent(lang);
  let m = html.match(/<head(\s[^>]*)?>/i);
  if (m) {
    const i = m.index + m[0].length;
    return html.slice(0, i) + "\n" + khoi + html.slice(i);
  }
  m = html.match(/<html(\s[^>]*)?>/i);
  if (m) {
    const i = m.index + m[0].length;
    return html.slice(0, i) + "\n" + khoi + html.slice(i);
  }
  return null;
}

function diCay(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (f.name === "node_modules" || f.name.startsWith(".")) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) diCay(p, out);
    else if (f.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function laChayThang() {
  try { return fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(process.argv[1] || ""); } catch { return false; }
}

if (laChayThang()) {
  const files = diCay(ROOT, []).sort();
  let daCo = 0, chen = 0, boQua = 0, khongChoChen = 0;
  const theoLang = { vi: 0, en: 0, ja: 0 };
  for (const p of files) {
    const rel = path.relative(ROOT, p);
    if (BO_QUA.has(path.basename(p))) { boQua++; continue; }
    const lang = rel.startsWith("en/") || rel.startsWith("en" + path.sep) ? "en" : rel.startsWith("ja/") || rel.startsWith("ja" + path.sep) ? "ja" : "vi";
    const html = fs.readFileSync(p, "utf8");
    if (html.includes(MOC)) { daCo++; continue; }
    const moi = chenConsent(html, lang);
    if (moi == null) { console.log(`  KHÔNG có <head>/<html>: ${rel}`); khongChoChen++; continue; }
    if (ghi) fs.writeFileSync(p, moi, "utf8");
    chen++; theoLang[lang]++;
  }
  console.log(`\n${files.length} file .html · đã có ${daCo} · ${ghi ? "vừa chèn" : "sẽ chèn"} ${chen} (vi ${theoLang.vi} · en ${theoLang.en} · ja ${theoLang.ja}) · bỏ qua trang chính sách ${boQua} · không chèn được ${khongChoChen}`);
  if (!ghi) console.log("Bản xem thử — thêm --ghi để chèn thật.");
  if (khongChoChen) process.exitCode = 1;
}
