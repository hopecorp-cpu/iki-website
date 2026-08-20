/**
 * CẦU NỐI CHỈ MỤC — bắc liên kết từ bài ĐÃ vào chỉ mục sang bài CHƯA vào.
 *
 * VÌ SAO: đo bằng URL Inspection API ngày 20/08 — 385 bài blog thì chỉ 37 bài nằm trong chỉ mục
 * Google, 251 bài "đã phát hiện — chưa lập chỉ mục", 96 bài Google chưa từng biết tới. Sitemap có
 * đủ 388 địa chỉ và Google đã đọc lại ngày 18/08, nên sitemap KHÔNG phải chỗ thiếu: Google đọc
 * sitemap nhưng không tiêu ngân sách thu thập để tải hết địa chỉ trong đó về.
 *
 * Thứ dẫn được Googlebot tới một trang là LINK TỪ MỘT TRANG NÓ CHỊU BÒ QUA. Mà trang nó chịu bò
 * qua thì mình biết đích danh: 37 bài đã nằm trong chỉ mục. Đó là 37 cánh cửa.
 *
 * CHIA PHẦN chứ không lấy ngẫu nhiên: 347 bài chưa vào chia đều cho 37 cửa, mỗi cửa ~10 bài, và
 * MỖI BÀI CHƯA VÀO CHỈ ĐƯỢC MỘT CỬA DẪN. Lấy ngẫu nhiên hay lấy top-N thì mấy bài đầu bảng chữ
 * cái được dẫn hàng chục lần còn phần đuôi không bao giờ tới lượt — đúng cái bẫy đã gặp ở máy
 * đăng chéo. Chia theo phép chia lấy dư nên TẤT ĐỊNH: cùng bản đồ thì cùng kết quả, dựng lại bao
 * nhiêu lần cũng ra một trang y hệt (không đẻ diff rác mỗi lượt build).
 *
 * Bản đồ ở chi-muc-map.json tại gốc repo — CỐ Ý là file trong repo chứ không gọi Supabase: bản
 * dựng chạy trên GitHub Actions, không với tới máy CEO. Đo lại bằng scripts/kiem-chi-muc.mjs bên
 * repo hope-ops-hub rồi ghi đè file này.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SO_LINK = 10;

let _map = null;
function banDo() {
  if (_map) return _map;
  const p = path.join(ROOT, "chi-muc-map.json");
  _map = { daLap: [], chuaLap: [] };
  if (fs.existsSync(p)) {
    try { _map = JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { console.warn("  chi-muc-map.json hỏng:", e.message); }
  }
  return _map;
}

export const CSS_CAU_NOI = `
    .cau-noi{margin:34px 0;padding:22px 24px;border:1px solid #E3EADF;border-radius:14px;background:#FBFCFA}
    .cau-noi h3{margin:0 0 12px;font-size:1.08rem;color:#1F4D1F}
    .cau-noi ul{list-style:none;padding:0;margin:0;columns:2;column-gap:28px}
    .cau-noi li{break-inside:avoid;margin:0 0 8px;line-height:1.45;font-size:.95rem}
    .cau-noi a{color:#2E6B2D;text-decoration:none}
    .cau-noi a:hover{text-decoration:underline}
    @media(max-width:700px){.cau-noi ul{columns:1}}`;

/** Phần bài mà một cửa phải dẫn. Rỗng nếu slug không phải cửa (chưa vào chỉ mục). */
export function phanCua(slug) {
  const { daLap = [], chuaLap = [] } = banDo();
  const i = daLap.indexOf(slug);
  if (i < 0 || !daLap.length) return [];
  return chuaLap.filter((_, j) => j % daLap.length === i).slice(0, SO_LINK);
}

/**
 * Khối HTML. Chữ neo là TÊN BÀI thật — chữ neo là tín hiệu duy nhất nói cho máy tìm kiếm biết
 * trang đích nói về cái gì; "xem thêm" thì không nói được gì.
 */
export function khoiCauNoi(slug) {
  const ds = phanCua(slug);
  if (ds.length < 3) return "";
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<aside class="cau-noi" aria-label="Bài viết liên quan trên Blog IKI">
          <h3>Đọc thêm trên Blog IKI Healing</h3>
          <ul>${ds.map((b) => `<li><a href="${esc(b.slug)}.html">${esc(b.ten)}</a></li>`).join("")}</ul>
        </aside>`;
}

/** Thống kê để nghiệm thu: bao nhiêu bài chưa vào chỉ mục thật sự được ít nhất một cửa dẫn. */
export function thongKe() {
  const { daLap = [], chuaLap = [] } = banDo();
  const phu = new Set();
  for (const s of daLap) for (const b of phanCua(s)) phu.add(b.slug);
  return { cua: daLap.length, chua: chuaLap.length, duocDan: phu.size };
}
