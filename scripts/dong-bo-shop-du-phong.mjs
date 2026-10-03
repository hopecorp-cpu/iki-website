#!/usr/bin/env node
/**
 * Đồng bộ MẢNG DỰ PHÒNG `const PRODUCTS=[...]` trong shop/index.html (và giá trong JSON-LD của trang)
 * với nguồn giá chuẩn: https://hope-ops-hub.vercel.app/api/shop/san-pham (sửa ở Ops Hub /admin/cua-hang).
 *
 * Vì sao: trang /shop tự fetch API khi chạy JS, nhưng HTML tĩnh (trước khi JS chạy, lúc API lỗi, bot
 * đọc trang) vẫn hiện mảng gắn sẵn — mảng đó từng giữ Trà Tuệ Minh 162.000 trong khi API đã 168.000.
 *
 * AN TOÀN: API lỗi / không phải mảng / ít hơn 3 món → KHÔNG ghi gì, giữ nguyên file, exit 1.
 * Chỉ thay mảng và số giá; không đụng chữ nào khác trên trang.
 * Chạy: node scripts/dong-bo-shop-du-phong.mjs            (ghi)
 *       node scripts/dong-bo-shop-du-phong.mjs --xem      (chỉ in khác biệt)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "shop", "index.html");
const API = "https://hope-ops-hub.vercel.app/api/shop/san-pham";
const xem = process.argv.includes("--xem");

const ctl = new AbortController();
const t = setTimeout(() => ctl.abort(), 15000);
let ds;
try {
  const r = await fetch(API, { signal: ctl.signal });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  ds = Array.isArray(j?.sanPham) ? j.sanPham : null;
} catch (e) {
  console.error("API lỗi, GIỮ mảng cũ:", e?.message || e); process.exit(1);
} finally { clearTimeout(t); }
if (!ds || ds.length < 3 || ds.some((p) => !p?.n || !(p.price > 0))) { console.error("API trả thiếu/lệch khuôn (" + (ds?.length ?? 0) + " món), GIỮ mảng cũ"); process.exit(1); }

const src = fs.readFileSync(FILE, "utf8");
const m = /<script>const PRODUCTS=(\[[\s\S]*?\]);<\/script>/.exec(src);
if (!m) { console.error("Không thấy mốc <script>const PRODUCTS=[...];</script>"); process.exit(1); }
let cu;
try { cu = JSON.parse(m[1]); } catch { console.error("Mảng cũ không phải JSON thuần"); process.exit(1); }

// So từng tên để in khác biệt (báo cáo), rồi thay nguyên mảng bằng bản API.
const byN = new Map(cu.map((p) => [p.n, p]));
for (const p of ds) {
  const c = byN.get(p.n);
  if (!c) console.log("THÊM:", p.n, p.price);
  else if (c.price !== p.price) console.log("GIÁ:", p.n, c.price, "->", p.price);
}
for (const c of cu) if (!ds.find((p) => p.n === c.n)) console.log("BỎ (API không còn):", c.n);

let out = src.replace(m[0], "<script>const PRODUCTS=" + JSON.stringify(ds) + ";</script>");

// JSON-LD: cập nhật "price" của Product trùng tên với API (chỉ số, không đổi chữ).
out = out.replace(/("@type":\s*"Product",\s*"name":\s*")([^"]+)("[\s\S]*?"price":\s*)(\d+)/g, (all, a, name, b, gia) => {
  const p = ds.find((x) => x.n === name);
  if (!p || String(p.price) === gia) return all;
  console.log("JSON-LD:", name, gia, "->", p.price);
  return a + name + b + p.price;
});

if (out === src) { console.log("Không có gì đổi."); process.exit(0); }
if (xem) { console.log("(--xem) chưa ghi."); process.exit(0); }
fs.writeFileSync(FILE, out, "utf8");
console.log("Đã ghi shop/index.html:", ds.length, "món.");
