#!/usr/bin/env node
/**
 * lint-compliance.mjs — Chốt chặn từ cấm cho bài blog sức khoẻ (SP = thực phẩm bổ sung).
 * Port bộ từ cấm từ hope-ops-hub/lib/banned-words.ts + mở rộng riêng cho blog công khai.
 *
 * HARD (chặn cứng, exit 1): claim y khoa/điều trị/thải độc/TPCN...
 * SOFT (cảnh báo, cần người xem): trị/chữa/thuốc — có thể hợp lệ trong ngữ cảnh
 *   (vd "không phải thuốc", "bài thuốc dân gian" kể chuyện) nhưng phải rà tay.
 *
 * Chạy:  node scripts/lint-compliance.mjs <file...>     (mặc định quét blog-drafts/*.md + blog/*.html)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// HARD — chặn cứng (khớp DETECT + BANNED_REPLACEMENTS của ops-hub)
const HARD = [
  /thực phẩm chức năng/gi,
  /thải độc/gi,
  /\bdetox\b/gi,
  /thanh lọc/gi,
  /giảm cân/gi,
  /đặc trị/gi,
  /điều trị/gi,
  /chữa bệnh/gi,
  /chữa khỏi/gi,
  /khỏi bệnh/gi,
  /thần dược/gi,
  /cam kết (khỏi|hết bệnh)/gi,
  /hiệu quả sau \d+ ngày/gi,
];
// SOFT — cảnh báo, rà tay (không exit 1)
const SOFT = [/\btrị\b/gi, /\bchữa\b/gi, /\bthuốc\b/gi, /bài thuốc/gi, /công dụng/gi];

// Ngữ cảnh ĐƯỢC PHÉP — không tính là vi phạm:
//  - "IKI Detox" = tên brand
//  - câu disclaimer pháp lý bắt buộc (phủ định: "không ... thay thế thuốc chữa bệnh",
//    "không thay thế chẩn đoán ... y khoa") — chính là ngôn ngữ tuân thủ.
function stripAllowed(text) {
  return text
    .replace(/iki\s*detox/gi, "IKIBRAND")
    .replace(/\d+\s*ng[àa]y\s*detox/gi, "COURSENAME") // tên khoá "7 Ngày Detox" (site chính đang dùng)
    .replace(/không phải thuốc[^.]*?chữa bệnh/gi, "[DISCLAIMER]")
    .replace(/không (có tác dụng )?thay thế thuốc[^.]*?bệnh/gi, "[DISCLAIMER]")
    .replace(/không thay thế (chẩn đoán|điều trị)[^.]*?y khoa/gi, "[DISCLAIMER]")
    .replace(/không phải[^.]*?(điều trị|chẩn đoán)[^.]*?(y tế|y khoa)/gi, "[DISCLAIMER]");
}

function scan(file) {
  let raw = fs.readFileSync(file, "utf8");
  const text = stripAllowed(raw);
  const lines = text.split("\n");
  const hard = [], soft = [];
  lines.forEach((ln, i) => {
    for (const re of HARD) { const m = ln.match(new RegExp(re.source, re.flags)); if (m) hard.push({ line: i + 1, hit: m.join(", "), ctx: ln.trim().slice(0, 120) }); }
    for (const re of SOFT) { const m = ln.match(new RegExp(re.source, re.flags)); if (m) soft.push({ line: i + 1, hit: m.join(", "), ctx: ln.trim().slice(0, 120) }); }
  });
  return { hard, soft };
}

function main() {
  let files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!files.length) {
    const dirs = [path.join(ROOT, "blog-drafts"), path.join(ROOT, "blog")];
    files = [];
    for (const d of dirs) {
      if (!fs.existsSync(d)) continue;
      for (const f of fs.readdirSync(d)) if (/\.(md|html)$/.test(f)) files.push(path.join(d, f));
    }
  }
  if (!files.length) { console.log("Không có file để lint."); return; }
  let hardTotal = 0;
  for (const f of files) {
    const { hard, soft } = scan(f);
    const rel = path.relative(ROOT, f);
    if (!hard.length && !soft.length) { console.log(`✓ ${rel} — sạch`); continue; }
    console.log(`\n${rel}`);
    hard.forEach((h) => console.log(`  ✗ CẤM  L${h.line}  [${h.hit}]  ${h.ctx}`));
    soft.forEach((s) => console.log(`  ! rà   L${s.line}  [${s.hit}]  ${s.ctx}`));
    hardTotal += hard.length;
  }
  console.log("");
  if (hardTotal > 0) {
    console.error(`HỎNG: ${hardTotal} từ CẤM cứng — sửa trước khi publish.`);
    process.exit(1);
  }
  console.log("OK: 0 từ cấm cứng (soft nếu có thì rà tay).");
}

main();
