#!/usr/bin/env node
/**
 * lint-cam-nhan.mjs — Cổng chặn từ cấm cho TỪNG mẩu cảm nhận (testimonials[] trong content-plan.json).
 *
 * Vì sao chặt hơn lint-compliance: lời khách là "lời chứng thực". Nghị định 15/2018 Đ.27 cấm thực phẩm
 * bổ sung dùng lời/hình người bệnh để quảng cáo, nên mẩu cảm nhận KHÔNG được nhắc tên bệnh, triệu chứng,
 * chỉ số xét nghiệm, thuốc, bác sĩ/bệnh viện, "khỏi", "hết", số cân. Câu phủ định cũng không được miễn:
 * "không còn đau dạ dày" vẫn là khoe kết quả.
 *
 * build-structure.mjs gọi lintCamNhan() và LOẠI mẩu dính khỏi trang, in tên mẩu để người duyệt sửa.
 * Chạy tay:  node scripts/lint-cam-nhan.mjs            (quét content-plan.json, exit 1 nếu có mẩu dính)
 *            node scripts/lint-cam-nhan.mjs file.json  (file là mảng [{name,text}] — dùng để rà kho thô)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Ranh giới từ cho tiếng Việt (\b của JS không hiểu chữ có dấu).
const tu = (s) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${s})(?![\\p{L}\\p{N}])`, "iu");

export const NHOM_CAM = [
  ["tên bệnh", tu("bệnh|ung thư|ung bướu|khối u|bướu|tiểu đường|đái tháo đường|huyết áp|mỡ máu|gan nhiễm mỡ|men gan|gan|dạ dày|đại tràng|trào ngược|viêm|nhiễm khuẩn|nhiễm trùng|HP|xương khớp|thoái hoá|gout|gút|tim mạch|đột quỵ|(?<!cẩn )thận|tuyến giáp|trầm cảm|ốm|nằm viện|bệnh viện|vào viện|đi viện|nhập viện|chuyển viện|truyền dịch|truyền hoá chất|đi truyền|lịch truyền|hoá trị|xạ trị|phác đồ|sỏi|nấm|áp xe|tỳ vị yếu")],
  ["triệu chứng", tu("đau|mất ngủ|táo bón|tiêu chảy|đi ngoài|phân nát|phân lỏng|khó tiêu|tiêu hoá kém|đầy hơi|chướng bụng|buồn nôn|chóng mặt|sốt|ho|khó thở|mệt mỏi|suy nhược|hấp thụ kém|không hấp thụ|tê|ngứa")],
  ["chỉ số xét nghiệm", tu("xét nghiệm|chỉ số|đường huyết|HbA1c|cholesterol|mmol|mg/dl|siêu âm|kết quả khám")],
  ["thuốc", tu("thuốc|kháng sinh|thuốc tây")],
  ["bác sĩ", tu("bác sĩ|bác sỹ|BS|y tá|lương y")],
  ["khỏi / hết", tu("khỏi|hết")],
  ["cân nặng", /\d+([.,]\d+)?\s*(kg|kí|ký|cân)(?![\p{L}])/iu],
  ["cân nặng", tu("tăng cân|giảm cân|lên cân|xuống cân|giảm mỡ")],
  ["claim y khoa", tu("chữa|(?<!giá )trị|điều trị|thải độc|giải độc|detox|thanh lọc|phục hồi|hồi sức|đặc trị|thần dược|thực phẩm chức năng|nhịn ăn")],
];

// "hóa"/"hoá", "khỏe"/"khoẻ" là cùng một chữ, khác chỗ đặt dấu — đưa về một kiểu trước khi so.
const DAU = { "óa": "oá", "òa": "oà", "ỏa": "oả", "õa": "oã", "ọa": "oạ", "óe": "oé", "òe": "oè", "ỏe": "oẻ", "õe": "oẽ", "ọe": "oẹ", "úy": "uý", "ùy": "uỳ", "ủy": "uỷ", "ũy": "uỹ", "ụy": "uỵ" };
export const chuanDau = (s) => String(s || "").normalize("NFC").replace(/[óòỏõọ][ae]|[úùủũụ]y/giu, (m) => {
  const k = DAU[m.toLowerCase()]; if (!k) return m;
  return m[0] === m[0].toUpperCase() ? k[0].toUpperCase() + k.slice(1) : k;
});

/** Trả về danh sách vi phạm [{nhom, tu}] của một mẩu (gộp tên + nơi + chữ). Rỗng = sạch. */
export function lintCamNhan(t) {
  const s = chuanDau([t.name, t.place, t.text, t.product].filter(Boolean).join(" \n "));
  const out = [];
  for (const [nhom, re] of NHOM_CAM) {
    const m = s.match(re);
    if (m) out.push({ nhom, tu: m[0] });
  }
  // "bệnh nhân K", "điều trị K" = cách nói tránh ung thư. Chỉ soi phần lời, vì tên viết tắt "Anh K." là hợp lệ.
  const k = chuanDau(t.text).match(/(?<![\p{L}\p{N}])K(?![\p{L}\p{N}.])/u);
  if (k) out.push({ nhom: "tên bệnh", tu: k[0] });
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const f = process.argv[2];
  const list = f
    ? JSON.parse(fs.readFileSync(f, "utf8"))
    : JSON.parse(fs.readFileSync(path.join(ROOT, "content-plan.json"), "utf8")).testimonials || [];
  let dinh = 0;
  list.forEach((t, i) => {
    const v = lintCamNhan(t);
    if (!v.length) return;
    dinh++;
    console.log(`  LOẠI #${i + 1} ${t.name || "(không tên)"}: ${v.map((x) => `${x.nhom} "${x.tu}"`).join("; ")}`);
  });
  console.log(`lint-cam-nhan: ${list.length - dinh}/${list.length} mẩu sạch, ${dinh} mẩu dính từ cấm.`);
  process.exit(dinh ? 1 : 0);
}
