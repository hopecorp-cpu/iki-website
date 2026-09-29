#!/usr/bin/env node
/**
 * gan-nguon.mjs — chèn <script src="/assets/js/nguon.js"> vào MỌI trang HTML của ikihealing.com.
 *
 * Vì sao (29/09/2026, CEO: "gài tracking để xem nguồn leads đổ về các kênh nào"): form lead nằm rải
 * ở 400+ trang tĩnh (pop-up blog, landing ebook, quiz, /shop, tài liệu, quà tặng DN). Sửa từng form
 * để gửi thêm utm là 400 chỗ phải nhớ — nên đặt MỘT file dùng chung, nó tự bọc fetch và tự chèn
 * input ẩn cho form POST. Trang mới do build-*.mjs dựng đã có sẵn thẻ này; script đây vá trang cũ.
 *
 * Chạy:  node scripts/gan-nguon.mjs           (chỉ xem)
 *        node scripts/gan-nguon.mjs --ghi     (vá thật)
 *
 * Idempotent: nhận diện bằng đường dẫn file nên chạy lại không chèn đôi.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const THE_NGUON = '<script src="/assets/js/nguon.js" defer></script>';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ghi = process.argv.includes("--ghi");
const BO_QUA = new Set(["node_modules", ".git", "blog-drafts", "docs", "team-photos", "videos"]);

/** Chèn thẻ ngay trước </head>; trang không có </head> thì trước </body>. */
export function chenNguon(html) {
  if (html.includes("assets/js/nguon.js")) return html;
  const i = html.toLowerCase().lastIndexOf("</head>");
  if (i >= 0) return html.slice(0, i) + "  " + THE_NGUON + "\n" + html.slice(i);
  const j = html.toLowerCase().lastIndexOf("</body>");
  if (j >= 0) return html.slice(0, j) + THE_NGUON + "\n" + html.slice(j);
  // Trang dựng tay không có head/body (vd /shop) — trình duyệt tự bọc, chèn trước </html> vẫn chạy.
  const k = html.toLowerCase().lastIndexOf("</html>");
  if (k >= 0) return html.slice(0, k) + THE_NGUON + "\n" + html.slice(k);
  return html.trimEnd() + "\n" + THE_NGUON + "\n";
}

function quet(dir, ra = []) {
  for (const t of fs.readdirSync(dir, { withFileTypes: true })) {
    if (t.name.startsWith(".") || BO_QUA.has(t.name)) continue;
    const p = path.join(dir, t.name);
    if (t.isDirectory()) quet(p, ra);
    else if (t.name.endsWith(".html")) ra.push(p);
  }
  return ra;
}

if (import.meta.url === `file://${process.argv[1]}` || fs.realpathSync(process.argv[1] || "") === fs.realpathSync(fileURLToPath(import.meta.url))) {
  const files = quet(ROOT);
  let da = 0, moi = 0, hong = 0;
  for (const p of files) {
    const html = fs.readFileSync(p, "utf8");
    if (html.includes("assets/js/nguon.js")) { da++; continue; }
    const sua = chenNguon(html);
    if (sua === html) { hong++; console.log("  KHÔNG có </head> lẫn </body>: " + path.relative(ROOT, p)); continue; }
    moi++;
    if (ghi) fs.writeFileSync(p, sua);
  }
  console.log(`\n${files.length} trang · đã có ${da} · ${ghi ? "vừa vá" : "sẽ vá"} ${moi} · không chèn được ${hong}`);
  if (!ghi) console.log("Chỉ xem. Thêm --ghi để vá thật.");
}
