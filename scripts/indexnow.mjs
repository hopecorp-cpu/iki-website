#!/usr/bin/env node
/**
 * Báo địa chỉ mới cho Bing/Yandex qua IndexNow.
 *
 * VÌ SAO ĐÁNG LÀM dù không giúp gì cho Google: **ChatGPT tìm kiếm chạy trên chỉ mục của Bing**.
 * Không nằm trong Bing thì trợ lý AI không có gì để trích, mà GEO chính là việc mình đang xây.
 * Google KHÔNG nhận IndexNow (họ đã nói rõ) — với Google chỉ có sitemap, thẩm quyền tên miền, và
 * nút "Yêu cầu lập chỉ mục" bấm tay trong Search Console (~10-12 địa chỉ/ngày).
 *
 * KHÔNG dùng Google Indexing API: đường đó CHỈ hợp lệ cho JobPosting và BroadcastEvent. Bắn trang
 * thường vào đó là lách điều khoản, và cái giá phải trả nếu bị bắt lớn hơn nhiều so với thứ thu
 * được. Đừng phiên sau thấy "có API mà không dùng" rồi đi cắm vào.
 *
 * Khoá xác thực nằm ở tệp <khoá>.txt tại gốc site — Bing tải tệp đó về để chắc mình là chủ.
 *
 * Chạy: node scripts/indexnow.mjs [--tat-ca] [--xem]
 *   mặc định: gửi các địa chỉ đổi trong 7 ngày gần nhất theo lastmod của sitemap
 *   --tat-ca : gửi toàn bộ (trần 10.000 địa chỉ mỗi lượt theo luật IndexNow)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "ikihealing.com";
const TAT_CA = process.argv.includes("--tat-ca");
const XEM = process.argv.includes("--xem");

const khoaFile = fs.readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!khoaFile) { console.error("Không thấy tệp khoá IndexNow ở gốc repo (dạng <32 ký tự hex>.txt)"); process.exit(1); }
const KHOA = khoaFile.replace(".txt", "");
if (fs.readFileSync(path.join(ROOT, khoaFile), "utf8").trim() !== KHOA) {
  console.error("Nội dung tệp khoá phải ĐÚNG BẰNG tên tệp (không có tên khoá thì Bing từ chối cả lô)");
  process.exit(1);
}

const xml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const muc = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1],
  ngay: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || "",
})).filter((x) => x.loc);

const moc = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
const ds = [...new Set((TAT_CA ? muc : muc.filter((x) => x.ngay >= moc)).map((x) => x.loc))].slice(0, 10000);

console.log(`Địa chỉ trong sitemap: ${muc.length} · sẽ gửi: ${ds.length}${TAT_CA ? " (toàn bộ)" : ` (đổi từ ${moc})`}`);
if (!ds.length) { console.log("Không có địa chỉ nào để gửi."); process.exit(0); }
if (XEM) { ds.slice(0, 10).forEach((u) => console.log("  -", u)); process.exit(0); }

const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KHOA, keyLocation: `https://${HOST}/${khoaFile}`, urlList: ds }),
});
const chu = await r.text();
// 200 và 202 đều là nhận. 403 = khoá sai chỗ, 422 = địa chỉ không thuộc host, 429 = gửi quá dày.
console.log(`IndexNow trả ${r.status}${chu ? " " + chu.slice(0, 200) : ""}`);
if (!r.ok && r.status !== 202) process.exitCode = 1;
