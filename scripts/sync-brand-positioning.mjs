#!/usr/bin/env node
// Update shared brand descriptions without rewriting published educational articles.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_NAME, brandOrganization, LEGACY_APP_SLUGS, ARCHIVE_NOTE } from "./brand-profile.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandLink = '<a href="/ve-hope.html#dinh-vi-iki">IKI Beauty &amp; Wellness</a> — hệ sinh thái chăm sóc sức khỏe chủ động cho phụ nữ và gia đình.';
const replacements = [
  ['<a href="../quiz/">Kiểm tra thể trạng 90 giây</a> — nhận bản phân tích 6 chỉ số lối sống theo Đông y, miễn phí.', brandLink],
  ['<a href="https://ikihealing.com/quiz">Kiểm tra thể trạng 90 giây</a> — nhận bản phân tích 6 chỉ số lối sống theo Đông y, miễn phí.', brandLink],
  ['<a href="/quiz/">Kiểm tra thể trạng 90 giây</a> — nhận bản phân tích 6 chỉ số theo Đông y, miễn phí.', brandLink],
  ['App IKI — <a href="../app.html">iOS &amp; Android</a>. AI Coach Đông Y cá nhân hoá theo thể tạng.', '<a href="/app.html">Ứng dụng IKI Beauty &amp; Wellness</a> — chăm sóc cá nhân hóa có AI hỗ trợ. Đang phát triển.'],
  ['<a href="../app.html">App IKI</a> — AI Coach Đông y cá nhân hoá theo thể tạng, nhật ký sức khoẻ 30 giây mỗi ngày.', '<a href="/app.html">Ứng dụng IKI Beauty &amp; Wellness</a> — khám phá thiết kế chăm sóc cá nhân hóa có AI hỗ trợ; đang phát triển.'],
  ['<p>AI Coach Đông Y cá nhân hoá theo thể tạng — nhật ký 30 giây mỗi ngày. Miễn phí.</p>', '<p>Khám phá thiết kế IKI Beauty &amp; Wellness: chăm sóc cá nhân hóa và thói quen hằng ngày có AI hỗ trợ. Ứng dụng đang phát triển.</p>'],
  ['AI Coach Đông Y cá nhân hoá theo thể tạng — <a href="../app.html">tải ứng dụng IKI</a>', '<a href="/app.html">IKI Beauty &amp; Wellness</a> — ứng dụng chăm sóc cá nhân hóa có AI hỗ trợ, đang phát triển.'],
];

function updateSchema(value) {
  if (Array.isArray(value)) return value.map(updateSchema);
  if (!value || typeof value !== "object") return value;
  const result = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, updateSchema(v)]));
  if (result["@type"] === "Organization" && /^IKI(?: Healing)?(?: — by HOPE CORP)?$/.test(result.name || "")) {
    if (result.url?.replace(/\/$/, "") === "https://ikihealing.com") {
      Object.assign(result, brandOrganization());
      // The brand and its legal owner are separate entities.
      delete result.legalName; delete result.taxID; delete result.foundingDate;
    } else result.name = BRAND_NAME;
  }
  if (result.description === "The Tao Engineer — kỹ sư hệ thống bắc cầu giữa AI hiện đại và tri thức Y học Cổ truyền phương Đông.") {
    result.description = "Nhà sáng lập HOPE CORP, kết nối công nghệ và kiến thức chăm sóc sức khỏe chủ động trong hệ sinh thái IKI Beauty & Wellness dành cho phụ nữ và gia đình.";
  }
  if (result.description === "Giám đốc Marketing (CMO). Chuyên gia Thực dưỡng dẫn dắt cộng đồng 200K+ thành viên.") {
    result.description = "Giám đốc Marketing, chuyên gia Thực dưỡng và đồng sáng lập HOPE CORP. Phát triển nội dung, cộng đồng và quan hệ đối tác trong hệ sinh thái IKI.";
  }
  return result;
}

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ["node_modules", "assets"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}
let changed = 0;
for (const file of htmlFiles(root)) {
  const before = fs.readFileSync(file, "utf8");
  let html = before;
  for (const [old, next] of replacements) html = html.replaceAll(old, next);
  html = html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/g, (all, open, body, close) => {
    let parsed;
    try { parsed = JSON.parse(body); } catch { throw new Error(`Invalid JSON-LD: ${file}`); }
    const updated = updateSchema(parsed);
    return JSON.stringify(parsed) === JSON.stringify(updated) ? all : open + "\n" + JSON.stringify(updated, null, 2) + "\n" + close;
  });
  html = html.replace(/<meta\b[^>]*>/g, tag => {
    if (!/property=["']og:site_name["']/.test(tag)) return tag;
    return tag.replace(/content=["']IKI Healing(?: — by HOPE CORP)?["']/, 'content="IKI Beauty &amp; Wellness"');
  });
  const slug = path.basename(file, ".html");
  if (LEGACY_APP_SLUGS.has(slug)) {
    const lang = path.relative(root, file).split(path.sep)[0];
    const copy = lang === "en" ? ["App information has changed", "Updated 14 September 2026: This article is retained as a reference to an earlier IKI app design. The current direction is IKI Beauty & Wellness, a proactive health and wellbeing ecosystem for women and families. Features, images and prices in this earlier design are not release information for the current app.", "Explore the current IKI Beauty & Wellness app", "/en/app.html"]
      : lang === "ja" ? ["アプリ情報を更新しました", "2026年9月14日更新：この記事は、以前のIKIアプリの設計を紹介する資料として保存しています。現在の方向性は、女性と家族の主体的な健康づくりを支えるIKI Beauty & Wellnessです。以前の設計に含まれる機能、画像、価格は、現在のアプリの公開情報を示すものではありません。", "現在のIKI Beauty & Wellnessを見る", "/ja/app.html"]
      : ["Thông tin ứng dụng đã cập nhật", ARCHIVE_NOTE, "Xem IKI Beauty & Wellness hiện tại", "/app.html"];
    const escape = text => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
    const note = `<aside class="info-box ib-note" data-iki-archive="20260914"><div class="ib-title">${copy[0]}</div><p>${escape(copy[1])} <a href="${copy[3]}">${escape(copy[2])} →</a></p></aside>`;
    if (html.includes('data-iki-archive="20260914"')) html = html.replace(/<aside[^>]*data-iki-archive="20260914"[\s\S]*?<\/aside>/, note);
    else {
      if (!html.includes('<div class="post-wrap">')) throw new Error(`Missing article container: ${file}`);
      html = html.replace('<div class="post-wrap">', '<div class="post-wrap">' + note);
    }
    html = html.replace(/<meta\b[^>]*>/g, tag => {
      if (!/(?:name|property)=["'](?:description|og:description|twitter:description)["']/.test(tag)) return tag;
      return tag.replace(/content="[^"]*"/, 'content="' + escape(copy[1]) + '"');
    });
  }
  if (html !== before) { fs.writeFileSync(file, html); changed++; }
}
// Keep the disclosure date when blog generation rebuilds sitemap entries from older drafts.
const sitemap = path.join(root, "sitemap.xml");
if (fs.existsSync(sitemap)) {
  const xml = fs.readFileSync(sitemap, "utf8");
  const updated = xml.replace(/<url>[\s\S]*?<\/url>/g, block => {
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1] || "";
    const slug = loc.split("/").pop()?.replace(/\.html$/, "");
    if (!LEGACY_APP_SLUGS.has(slug)) return block;
    const date = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
    if (date && date >= "2026-09-14") return block;
    return date ? block.replace(/<lastmod>.*?<\/lastmod>/, "<lastmod>2026-09-14</lastmod>") : block.replace("</loc>", "</loc><lastmod>2026-09-14</lastmod>");
  });
  if (updated !== xml) fs.writeFileSync(sitemap, updated);
}
console.log(`Brand positioning: ${changed} HTML files updated.`);
