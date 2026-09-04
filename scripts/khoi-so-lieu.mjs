/**
 * khoi-so-lieu.mjs — BỘ KHỐI TRỰC QUAN cho bài báo cáo số liệu của IKI.
 *
 * Vì sao có file này (CEO 04/09/2026, sau khi đọc bài "Shein và cái bẫy mang tên biên lãi gộp"
 * của Nguyễn Xuân Đông trên CafeBiz): bài đó dựng số thành BẢNG + BIỂU ĐỒ + KHỐI SỐ NỔI, còn
 * báo cáo của mình đo ra là **0 bảng, 0 biểu đồ, 2.865 từ toàn chữ** — người đọc phải tự dựng
 * hình trong đầu, và báo chí không có gì để trích lại.
 *
 * BA QUYẾT ĐỊNH, đừng đổi mà không đọc lý do:
 * 1. **SVG TĨNH, KHÔNG JAVASCRIPT.** Bài blog là HTML tĩnh trên GitHub Pages; biểu đồ vẽ bằng JS
 *    thì trợ lý AI đọc trang không thấy số nào, mà GEO/AEO đang là mục tiêu chính. SVG có <text>
 *    thật nên máy đọc được, và không phụ thuộc thư viện ngoài (CSP của trang chặn CDN lạ).
 * 2. **MỌI SỐ ĐỀU TỪ THAM SỐ, KHÔNG TỰ TÍNH.** Hàm ở đây chỉ VẼ. Luật số của báo cáo (cấm bịa,
 *    cấm suy ra số mới) nằm ở người/máy gọi — file này không được phép "làm tròn cho đẹp".
 * 3. **Bảng đi kèm biểu đồ, không thay nhau.** Biểu đồ cho mắt, bảng cho máy đọc và cho người
 *    muốn trích lại con số. Bài Shein làm đúng vậy.
 *
 * Dùng: import { bangSoLieu, bieuDoCot, bieuDoDuong, khoiSoNoi, khoiCoChe, cauTrichDan } from "./khoi-so-lieu.mjs"
 */

const XANH = "#1F4D2F";       // xanh thương hiệu IKI
const XANH_NHAT = "#E8F0E8";
const VANG = "#D7B46A";       // gạch nhấn
const XAM = "#8B8776";
const LUOI = "#E6E2D6";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Bảng số liệu — cột đầu là tên chỉ tiêu, các cột sau là kỳ.
 * cot: ["CHỈ TIÊU","T4","T5"] · dong: [["Số đơn","461","395"], ...]
 * Bọc trong .bang-so-wrap để tràn ngang thì CUỘN, không phá layout điện thoại (luật mục 11m).
 */
export function bangSoLieu({ cot, dong, caption = "" }) {
  if (!Array.isArray(cot) || !Array.isArray(dong) || !dong.length) throw new Error("bangSoLieu: thiếu cot/dong");
  const sai = dong.find((d) => d.length !== cot.length);
  if (sai) throw new Error(`bangSoLieu: dòng "${sai[0]}" có ${sai.length} ô, bảng có ${cot.length} cột`);
  return `<div class="bang-so-wrap"><table class="bang-so">
<thead><tr>${cot.map((c, i) => `<th${i ? ' class="so"' : ""}>${esc(c)}</th>`).join("")}</tr></thead>
<tbody>${dong.map((d) => `<tr>${d.map((o, i) => `<td${i ? ' class="so"' : ""}>${esc(o)}</td>`).join("")}</tr>`).join("\n")}</tbody>
</table>${caption ? `<p class="bang-so-caption">${esc(caption)}</p>` : ""}</div>`;
}

/** Trục dọc: chọn mốc tròn bao trọn dải số. Trả {min,max,mocs}. */
function tinhTruc(giaTri) {
  const lo = Math.min(...giaTri, 0);
  const hi = Math.max(...giaTri);
  if (hi === lo) return { min: lo, max: lo + 1, mocs: [lo, lo + 1] };
  const buoc = Math.pow(10, Math.floor(Math.log10(hi - lo))) / 2;
  const min = Math.floor(lo / buoc) * buoc;
  const max = Math.ceil(hi / buoc) * buoc;
  const mocs = [];
  for (let v = min; v <= max + 1e-9; v += (max - min) / 4) mocs.push(Math.round(v * 100) / 100);
  return { min, max, mocs };
}

const soGon = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10).replace(".", ","));

/**
 * Biểu đồ CỘT — hợp nhất cho báo cáo của mình (so vài kỳ hoặc vài phân khúc).
 * diem: [{nhan:"T4", giaTri:461}, ...] · donVi in ở caption, KHÔNG in trong ô.
 */
export function bieuDoCot({ diem, tieuDe = "", donVi = "", noiBat = -1 }) {
  if (!Array.isArray(diem) || diem.length < 2) throw new Error("bieuDoCot: cần ít nhất 2 điểm");
  const W = 640, H = 300, L = 46, R = 16, T = 18, B = 42;
  const { min, max, mocs } = tinhTruc(diem.map((d) => d.giaTri));
  const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
  const rongO = (W - L - R) / diem.length;
  const rongCot = Math.min(64, rongO * 0.56);
  const luoi = mocs.map((m) => `<line x1="${L}" y1="${y(m).toFixed(1)}" x2="${W - R}" y2="${y(m).toFixed(1)}" stroke="${LUOI}" stroke-width="1"/><text x="${L - 8}" y="${(y(m) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${XAM}">${soGon(m)}</text>`).join("");
  const cot = diem.map((d, i) => {
    const x = L + rongO * i + (rongO - rongCot) / 2;
    const yv = y(d.giaTri), cao = Math.max(1, y(min) - yv);
    const mau = i === noiBat ? VANG : XANH;
    return `<rect x="${x.toFixed(1)}" y="${yv.toFixed(1)}" width="${rongCot.toFixed(1)}" height="${cao.toFixed(1)}" fill="${mau}" rx="3"/>` +
      `<text x="${(x + rongCot / 2).toFixed(1)}" y="${(yv - 7).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="${XANH}">${esc(d.hienThi ?? soGon(d.giaTri))}</text>` +
      `<text x="${(x + rongCot / 2).toFixed(1)}" y="${H - B + 20}" text-anchor="middle" font-size="12" fill="${XAM}">${esc(d.nhan)}</text>`;
  }).join("");
  return `<figure class="bieu-do"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(tieuDe || "Biểu đồ số liệu")}" xmlns="http://www.w3.org/2000/svg">
<title>${esc(tieuDe || "Biểu đồ số liệu")}</title>${luoi}${cot}
<line x1="${L}" y1="${y(min).toFixed(1)}" x2="${W - R}" y2="${y(min).toFixed(1)}" stroke="${XAM}" stroke-width="1"/></svg>
${tieuDe || donVi ? `<figcaption>${esc(tieuDe)}${donVi ? ` · đơn vị: ${esc(donVi)}` : ""}</figcaption>` : ""}</figure>`;
}

/** Biểu đồ ĐƯỜNG — cho chuỗi nhiều kỳ liên tiếp (nhịp theo tháng, theo tuần). */
export function bieuDoDuong({ diem, tieuDe = "", donVi = "" }) {
  if (!Array.isArray(diem) || diem.length < 3) throw new Error("bieuDoDuong: cần ít nhất 3 điểm (ít hơn thì dùng bieuDoCot)");
  const W = 640, H = 300, L = 46, R = 16, T = 26, B = 42;
  const { min, max, mocs } = tinhTruc(diem.map((d) => d.giaTri));
  const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
  const x = (i) => L + ((W - L - R) / (diem.length - 1)) * i;
  const luoi = mocs.map((m) => `<line x1="${L}" y1="${y(m).toFixed(1)}" x2="${W - R}" y2="${y(m).toFixed(1)}" stroke="${LUOI}" stroke-width="1"/><text x="${L - 8}" y="${(y(m) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${XAM}">${soGon(m)}</text>`).join("");
  const duong = diem.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.giaTri).toFixed(1)}`).join(" ");
  const nen = `${duong} L${x(diem.length - 1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;
  // Nhãn giá trị điểm ĐẦU neo trái, điểm CUỐI neo phải: để anchor middle thì chữ tràn ra ngoài
  // khung và ĐÈ LÊN nhãn trục dọc (đo bằng mắt 04/09 — "500" của trục bị "461,4" phủ mất).
  const neo = (i) => (i === 0 ? "start" : i === diem.length - 1 ? "end" : "middle");
  const cham = diem.map((d, i) =>
    `<circle cx="${x(i).toFixed(1)}" cy="${y(d.giaTri).toFixed(1)}" r="4" fill="${XANH}"/>` +
    `<text x="${x(i).toFixed(1)}" y="${(y(d.giaTri) - 11).toFixed(1)}" text-anchor="${neo(i)}" font-size="12" font-weight="700" fill="${XANH}">${esc(d.hienThi ?? soGon(d.giaTri))}</text>` +
    `<text x="${x(i).toFixed(1)}" y="${H - B + 20}" text-anchor="middle" font-size="12" fill="${XAM}">${esc(d.nhan)}</text>`).join("");
  return `<figure class="bieu-do"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(tieuDe || "Biểu đồ số liệu")}" xmlns="http://www.w3.org/2000/svg">
<title>${esc(tieuDe || "Biểu đồ số liệu")}</title>${luoi}
<path d="${nen}" fill="${XANH_NHAT}"/><path d="${duong}" fill="none" stroke="${XANH}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${cham}
<line x1="${L}" y1="${y(min).toFixed(1)}" x2="${W - R}" y2="${y(min).toFixed(1)}" stroke="${XAM}" stroke-width="1"/></svg>
${tieuDe || donVi ? `<figcaption>${esc(tieuDe)}${donVi ? ` · đơn vị: ${esc(donVi)}` : ""}</figcaption>` : ""}</figure>`;
}

/** Khối SỐ NỔI — 2-4 con số đầu bảng, thứ báo chí trích lại được. */
export function khoiSoNoi(muc) {
  if (!Array.isArray(muc) || muc.length < 2 || muc.length > 4) throw new Error("khoiSoNoi: nhận 2-4 mục");
  return `<div class="so-noi">${muc.map((m) => `<div class="so-noi-o"><div class="so-noi-so">${esc(m.so)}</div><div class="so-noi-nhan">${esc(m.nhan)}</div></div>`).join("")}</div>`;
}

/**
 * Khối CƠ CHẾ — giải thích vì sao con số vận động như vậy. Bài Shein dùng đúng khối này cho phần
 * khó nhất, và đó là chỗ tách bài phân tích khỏi bài liệt kê số.
 */
export function khoiCoChe({ tieuDe = "CƠ CHẾ", noiDung }) {
  return `<aside class="khoi-co-che"><h3>${esc(tieuDe)}</h3><p>${esc(noiDung)}</p></aside>`;
}

/** Câu chốt trích dẫn — một câu, đặt sau đoạn đã chứng minh nó. */
export function cauTrichDan(cau) {
  return `<blockquote class="cau-chot">${esc(cau)}</blockquote>`;
}

/** CSS của bộ khối — build-article.mjs chèn vào <style> của bài báo cáo. */
export const CSS_KHOI_SO = `
.bang-so-wrap{overflow-x:auto;margin:28px 0}
.bang-so{width:100%;border-collapse:collapse;font-size:15px;min-width:420px}
.bang-so th,.bang-so td{padding:10px 12px;border-bottom:1px solid #E6E2D6;text-align:left}
.bang-so th{background:#F5F7F3;color:#1F4D2F;font-weight:700;font-size:13px;letter-spacing:.3px;text-transform:uppercase}
.bang-so td.so,.bang-so th.so{text-align:right;font-variant-numeric:tabular-nums}
.bang-so tbody tr:hover{background:#FAFBF8}
.bang-so-caption{margin:8px 0 0;font-size:13px;color:#8B8776;font-style:italic}
.bieu-do{margin:28px 0}
.bieu-do svg{width:100%;height:auto;display:block}
.bieu-do figcaption{margin-top:8px;font-size:13px;color:#8B8776;text-align:center}
.so-noi{display:flex;flex-wrap:wrap;gap:14px;margin:28px 0}
.so-noi-o{flex:1 1 150px;padding:16px 18px;background:#F5F7F3;border-left:4px solid #D7B46A;border-radius:4px}
.so-noi-so{font-size:30px;font-weight:800;color:#1F4D2F;line-height:1.15;font-variant-numeric:tabular-nums}
.so-noi-nhan{margin-top:4px;font-size:13px;color:#5A5A50}
.khoi-co-che{margin:28px 0;padding:18px 20px;background:#FAFAF5;border:1px solid #E6E2D6;border-radius:6px}
.khoi-co-che h3{margin:0 0 8px;font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:#8B8776}
.khoi-co-che p{margin:0;font-size:15px;line-height:1.75}
blockquote.cau-chot{margin:28px 0;padding:0 0 0 20px;border-left:4px solid #1F4D2F;font-size:19px;line-height:1.6;font-weight:600;color:#1F4D2F;font-style:normal}
@media(max-width:600px){.so-noi-so{font-size:25px}blockquote.cau-chot{font-size:17px}}
`;
