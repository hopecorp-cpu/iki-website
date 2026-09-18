#!/usr/bin/env node
/**
 * Kéo feed danh mục Pinterest về repo (CHẠY TAY, khi cần).
 *
 * TỪ 18/09/2026 feed KHÔNG còn dựng ở đây. Nguồn duy nhất là bảng giá hope-ops-hub /admin/cua-hang;
 * phần dựng (nắn tiêu đề, cửa từ cấm, danh sách loại, taxonomy) nằm ở hope-ops-hub lib/pinterest-feed.ts,
 * và mỗi lần bấm Lưu ở admin máy tự đẩy pinterest-feed.csv/.tsv lên repo này. Script này chỉ để kéo
 * tay khi lượt đẩy tự động hỏng — cùng một bộ dựng, không có bản logic thứ hai để lệch nhau.
 *
 * Đầu ra: pinterest-feed.csv + pinterest-feed.tsv ở gốc repo -> https://ikihealing.com/pinterest-feed.csv
 * Chạy: node scripts/pinterest-feed.mjs [--xem]
 */
import { writeFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://hope-ops-hub.vercel.app/api/shop/pinterest-feed";

async function main() {
  const r = await fetch(API);
  const f = await r.json().catch(() => null);
  if (!r.ok || !f || f.error) { console.error("DỪNG — không lấy được feed:", f?.error || r.status); process.exit(1); }
  if (f.viPham?.length) {
    console.error("DỪNG — chữ sẽ đi ra Pinterest còn dính rào pháp lý (sửa ở /admin/cua-hang):");
    for (const [ten, ly] of f.viPham) console.error("  •", ten, "=>", ly);
    process.exit(1);
  }
  if (!f.soDong) { console.error("DỪNG — 0 sản phẩm hợp lệ, không ghi feed rỗng đè bản cũ."); process.exit(1); }
  console.log(`Sản phẩm vào feed: ${f.soDong}/${f.tong}`);
  for (const [ten, ly] of f.boQua || []) console.log("  bỏ qua:", ten, "—", ly);
  if (process.argv.includes("--xem")) { console.log(f.csv.split("\n").slice(0, 4).join("\n")); return; }
  writeFileSync(join(GOC, "pinterest-feed.csv"), f.csv, "utf8");
  writeFileSync(join(GOC, "pinterest-feed.tsv"), f.tsv, "utf8");
  console.log("Đã ghi pinterest-feed.csv và pinterest-feed.tsv");
}

function laChayThang() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1] || "");
  } catch { return false; }
}
if (laChayThang()) main();
