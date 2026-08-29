/**
 * Thẻ og:image DỌC (ảnh pin Pinterest 1000x1500) cho bài blog — cắm THẲNG vào máy dựng bài.
 *
 * VÌ SAO Ở ĐÂY chứ không chèn sau khi dựng: HTML trong blog/ là FILE MÁY SINH — chèn tay vào
 * sản phẩm thì lượt build kế tiếp xoá sạch (đúng bẫy khối video đã sập, xem video-bai.mjs).
 * scripts/gan-pin-doc.mjs chỉ là lớp vá cho bài ĐÃ dựng và bài không có bản nháp .md.
 *
 * Nguồn: pin-index.json ở gốc repo, do hope-ops-hub/scripts/pinterest/tao-bo-pinterest.mjs ghi
 * (kèm ảnh trong assets/pin/). Bài không có trong chỉ mục thì trả chuỗi rỗng — không đổi gì.
 *
 * Thứ tự thẻ CÓ CHỦ Ý: ảnh dọc đứng SAU og:image ngang — Facebook/Zalo lấy thẻ đầu tiên (ngang,
 * đúng khung 1200x630), Pinterest đọc được cả hai và có ảnh 2:3 để ghim đẹp.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let _chiMuc = null;
function chiMuc() {
  if (_chiMuc) return _chiMuc;
  _chiMuc = {};
  const p = path.join(ROOT, "pin-index.json");
  if (fs.existsSync(p)) {
    try {
      for (const v of JSON.parse(fs.readFileSync(p, "utf8"))) if (v.slug && v.anh) _chiMuc[v.slug] = v.anh;
    } catch (e) { console.warn("  pin-index.json hỏng, bỏ qua og:image dọc:", e.message); }
  }
  return _chiMuc;
}

/** Khối meta og:image dọc cho một bài; rỗng nếu bài chưa có pin. */
export function ogPinDoc(slug) {
  const anh = chiMuc()[slug];
  if (!anh) return "";
  return `
  <meta property="og:image" content="https://ikihealing.com/${anh}" />
  <meta property="og:image:width" content="1000" />
  <meta property="og:image:height" content="1500" />`;
}
