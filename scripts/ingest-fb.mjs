#!/usr/bin/env node
/**
 * ingest-fb.mjs — Crawl bài đăng 2 fanpage HOPE về kho .md (content-kho/).
 *
 * Nguồn: Graph API published_posts của các page nằm trong tài khoản admin.
 * Token: đọc FB_USER_TOKEN / FB_ADS_TOKEN từ ops-hub .env.local (hoặc process.env).
 *
 * KHÔNG dùng insights post_impressions* (Facebook đã bỏ) — chỉ lấy reactions/comments/shares
 * qua summary edge. Ảnh: lưu URL tham khảo trong frontmatter, không tải về.
 *
 * Chạy:  node scripts/ingest-fb.mjs            (mặc định 24 tháng, 300 bài/page)
 *        node scripts/ingest-fb.mjs --months=12 --max=150
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const G = "https://graph.facebook.com/v25.0";

// --- args ---
const arg = (k, d) => {
  const m = process.argv.find((a) => a.startsWith(`--${k}=`));
  return m ? m.split("=")[1] : d;
};
const MONTHS = parseInt(arg("months", "24"), 10);
const MAX = parseInt(arg("max", "300"), 10);
const cutoff = Date.now() - MONTHS * 30 * 24 * 3600 * 1000;

// --- token ---
function getToken() {
  if (process.env.FB_USER_TOKEN) return process.env.FB_USER_TOKEN;
  if (process.env.FB_ADS_TOKEN) return process.env.FB_ADS_TOKEN;
  const envPaths = [
    "/Users/NguyenHung/Downloads/HOPE CORP/hope-ops-hub/.env.local",
    path.join(ROOT, ".env.local"),
    path.join(ROOT, ".env"),
  ];
  for (const p of envPaths) {
    if (!fs.existsSync(p)) continue;
    const env = fs.readFileSync(p, "utf8");
    for (const k of ["FB_USER_TOKEN", "FB_ADS_TOKEN"]) {
      const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
      if (m && m[1].trim()) return m[1].trim();
    }
  }
  return "";
}

// 2 fanpage cần crawl (id trong tài khoản admin — xác nhận qua me/accounts)
const PAGES = [
  { id: "563444633511898", slug: "fanpage-ndv", name: "Lương Y Ngô Đức Vượng Official" },
  { id: "105135721590818", slug: "fanpage-thanhtam", name: "Thanh Tâm Sống Khoẻ Mỗi Ngày" },
];

// --- helpers ---
function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
function yamlEsc(s) {
  return `"${String(s).replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
}

async function getPageToken(pageId, userToken) {
  const r = await fetch(
    `${G}/${pageId}?fields=access_token,name&access_token=${encodeURIComponent(userToken)}`
  );
  const j = await r.json();
  if (j.error) throw new Error(`page token ${pageId}: ${j.error.message}`);
  return j.access_token;
}

async function fetchPosts(page, pageToken) {
  const fields =
    "id,created_time,message,permalink_url,full_picture," +
    "attachments{media_type,type,title,description}," +
    "reactions.summary(true).limit(0),comments.summary(true).limit(0),shares";
  let url =
    `${G}/${page.id}/published_posts?fields=${encodeURIComponent(fields)}` +
    `&limit=50&access_token=${encodeURIComponent(pageToken)}`;
  const posts = [];
  while (url && posts.length < MAX) {
    const r = await fetch(url);
    const j = await r.json();
    if (j.error) throw new Error(`posts ${page.slug}: ${j.error.message}`);
    const data = j.data || [];
    if (!data.length) break;
    let stop = false;
    for (const p of data) {
      if (new Date(p.created_time).getTime() < cutoff) { stop = true; break; }
      posts.push(p);
    }
    if (stop || posts.length >= MAX) break;
    url = j.paging?.next || null;
    await new Promise((res) => setTimeout(res, 300)); // lịch sự với rate limit
  }
  return posts.slice(0, MAX);
}

function toMarkdown(p, page) {
  const date = (p.created_time || "").slice(0, 10);
  const msg = (p.message || "").trim();
  const firstLine = msg.split("\n").find((l) => l.trim()) || "bai-viet";
  const title = firstLine.slice(0, 120);
  const react = p.reactions?.summary?.total_count ?? 0;
  const cmt = p.comments?.summary?.total_count ?? 0;
  const shares = p.shares?.count ?? 0;
  const fm = [
    "---",
    `source: facebook`,
    `page: ${yamlEsc(page.name)}`,
    `page_id: "${page.id}"`,
    `post_id: "${p.id}"`,
    `date: "${date}"`,
    `permalink: "${p.permalink_url || ""}"`,
    `image: "${p.full_picture || ""}"`,
    `reactions: ${react}`,
    `comments: ${cmt}`,
    `shares: ${shares}`,
    `title: ${yamlEsc(title)}`,
    "---",
    "",
  ].join("\n");
  return fm + msg + "\n";
}

async function main() {
  const token = getToken();
  if (!token) {
    console.error("HỎNG: không tìm thấy FB_USER_TOKEN/FB_ADS_TOKEN.");
    process.exit(1);
  }
  let grandTotal = 0;
  const summary = [];
  for (const page of PAGES) {
    const outDir = path.join(ROOT, "content-kho", page.slug);
    fs.mkdirSync(outDir, { recursive: true });
    let pageToken;
    try {
      pageToken = await getPageToken(page.id, token);
    } catch (e) {
      console.error(`HỎNG page token ${page.name}: ${e.message}`);
      summary.push(`${page.name}: LỖI TOKEN`);
      continue;
    }
    let posts;
    try {
      posts = await fetchPosts(page, pageToken);
    } catch (e) {
      console.error(`HỎNG fetch ${page.name}: ${e.message}`);
      summary.push(`${page.name}: LỖI FETCH`);
      continue;
    }
    let written = 0;
    const seen = new Set();
    for (const p of posts) {
      const msg = (p.message || "").trim();
      if (msg.length < 40) continue; // bỏ post ảnh trơ / quá ngắn
      const date = (p.created_time || "").slice(0, 10);
      const firstLine = msg.split("\n").find((l) => l.trim()) || "bai";
      let slug = `${date}-${slugify(firstLine)}`;
      let base = slug, i = 2;
      while (seen.has(slug)) slug = `${base}-${i++}`;
      seen.add(slug);
      fs.writeFileSync(path.join(outDir, `${slug}.md`), toMarkdown(p, page), "utf8");
      written++;
    }
    grandTotal += written;
    summary.push(`${page.name}: ${written} bài (từ ${posts.length} post lấy về)`);
    console.log(`✓ ${page.name} → ${written} .md tại content-kho/${page.slug}/`);
  }
  console.log("\n=== TỔNG KẾT ===");
  summary.forEach((s) => console.log(" -", s));
  console.log(`Tổng: ${grandTotal} file .md`);
  if (grandTotal === 0) {
    console.error("HỎNG: 0 bài lấy được.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("HỎNG:", e.message);
  process.exit(1);
});
