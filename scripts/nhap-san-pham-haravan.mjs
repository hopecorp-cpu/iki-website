/**
 * nhap-san-pham-haravan.mjs — kéo sản phẩm từ store Haravan (ikihealingdetox.com)
 * vào san-pham-data.json, đánh cờ `an: true` (CHƯA MỞ BÁN, không hiện ở danh sách).
 *
 * Vì sao có script: CEO chốt 17/09 bỏ Haravan gộp về ikihealing.com, và 21/09 chốt
 * 301 toàn bộ. Haravan có 19 SP, /shop mới có 3 — 301 mà không có trang đích thì
 * khách bấm link cũ rơi vào hư không. Script dựng trang đích cho 16 món còn lại.
 *
 * LUẬT: chỉ chép thứ ĐỌC ĐƯỢC từ mô tả Haravan. Không suy diễn, không thêm công dụng.
 * Mô tả Haravan có món viết bằng CHỮ UNICODE TOÁN HỌC (𝐓𝐡𝐚̀𝐧𝐡 𝐩𝐡𝐚̂̀𝐧) — phải chuẩn hoá
 * trước khi quét từ cấm, không thì bộ lọc mù hoàn toàn (bài học 21/09).
 *
 * Chạy: node scripts/nhap-san-pham-haravan.mjs [--ghi]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORE = "https://ikihealingdetox.com";
const DA_CO = new Set(["true-vegan-protein", "tra-tue-minh", "tra-thanh-huong"]);
const HANDLE_TRUNG = new Set([
  "bot-dam-dinh-duong-true-vegan-proten-pro-500g", "tra-tue-minh", "tra-thanh-huong",
]);

const TU_CAM = [
  "chữa", "điều trị", "trị bệnh", "khỏi bệnh", "thải độc", "giải độc", "thanh lọc", "detox",
  "kháng khuẩn", "diệt khuẩn", "kháng sinh", "sát khuẩn", "mát gan", "hạ huyết áp",
  "hạ đường huyết", "tiểu đường", "mỡ máu", "ung thư", "phòng ngừa", "thuốc bổ",
  "chữa lành", "ký sinh trùng", "đào thải độc tố", "tăng cường miễn dịch", "giảm cân", "béo phì",
];

/** Chữ Unicode toán học/fullwidth -> chữ thường, để bộ lọc từ cấm nhìn thấy. */
function chuanHoa(s) {
  return (s || "").normalize("NFKC").normalize("NFC");
}
function loTu(text) {
  const t = chuanHoa(text).toLowerCase();
  return TU_CAM.filter((w) => t.includes(w));
}
function goiThe(html) {
  return chuanHoa(String(html || "").replace(/<[^>]+>/g, " "))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}
/** Cắt đoạn nằm giữa nhãn này và nhãn kế tiếp. */
function doan(text, nhan, cacNhanKhac) {
  const t = text;
  const i = t.toLowerCase().indexOf(nhan.toLowerCase());
  if (i < 0) return "";
  let het = t.length;
  for (const k of cacNhanKhac) {
    const j = t.toLowerCase().indexOf(k.toLowerCase(), i + nhan.length);
    if (j > -1 && j < het) het = j;
  }
  return t.slice(i + nhan.length, het).replace(/^[:\s-]+/, "").trim();
}

const NHAN = ["thành phần", "công dụng", "đặc điểm", "hướng dẫn sử dụng", "cách dùng",
  "hướng dẫn bảo quản", "bảo quản", "lưu ý", "điểm nổi bật", "khối lượng", "quy cách"];

function boc(p) {
  const raw = goiThe(p.body_html);
  const khac = (nhan) => NHAN.filter((n) => n !== nhan);
  const gia = Math.min(...(p.variants || []).map((v) => Math.round(Number(v.price) || 0)).filter((n) => n > 0));
  const cach = doan(raw, "hướng dẫn sử dụng", khac("hướng dẫn sử dụng")) || doan(raw, "cách dùng", khac("cách dùng"));
  return {
    slug: p.handle,
    ten: p.title,
    tenDayDu: p.title,
    loai: p.product_type || "",
    gia: Number.isFinite(gia) ? gia : 0,
    anhGoc: (p.images || [])[0]?.src || "",
    moTa: raw.slice(0, 320),
    moTaDayDu: raw,
    thanhPhanText: doan(raw, "thành phần", khac("thành phần")),
    cachDung: cach ? cach.split(/(?:\+ |; |\. (?=[A-ZĐÀ-Ỹ]))/).map((s) => s.trim()).filter((s) => s.length > 8).slice(0, 6) : [],
    baoQuan: doan(raw, "hướng dẫn bảo quản", khac("hướng dẫn bảo quản")) || doan(raw, "bảo quản", khac("bảo quản")),
    luuY: doan(raw, "lưu ý", khac("lưu ý")),
    an: true,            // CHƯA MỞ BÁN — không vào danh sách, không vào sitemap
    laTPBS: false,       // mặc định KHÔNG dán nhãn thực phẩm bổ sung; chỉ bật cho đúng món
    nguon: "haravan",
  };
}

async function main() {
  const r = await fetch(`${STORE}/collections/all/products.json?limit=250`, { cache: "no-store" });
  if (!r.ok) { console.error(`Haravan tra ${r.status}`); process.exit(1); }
  const { products = [] } = await r.json();
  if (!products.length) { console.error("Cao TRANG — dung, khong ghi."); process.exit(1); }

  const moi = products.filter((p) => !HANDLE_TRUNG.has(p.handle)).map(boc);
  console.log(`Haravan: ${products.length} SP · bo ${products.length - moi.length} mon da co tren /shop · nhap ${moi.length} mon\n`);

  let dinh = 0;
  for (const sp of moi) {
    const hit = loTu(`${sp.ten} ${sp.moTaDayDu}`);
    if (hit.length) { dinh++; console.log(`  [TU CAM] ${sp.slug}: ${hit.join(", ")}`); }
  }
  if (dinh) { console.error(`\n${dinh} mon dinh tu cam — DUNG, khong ghi. Sua mo ta tren Haravan truoc.`); process.exit(1); }
  console.log("Cua tu cam: 0 mon dinh (da chuan hoa chu Unicode truoc khi quet)\n");

  for (const sp of moi) {
    const thieu = ["thanhPhanText", "baoQuan"].filter((k) => !sp[k]);
    console.log(`  ${sp.slug.slice(0, 44).padEnd(44)} ${String(sp.gia).padStart(7)}d  ${thieu.length ? "thieu: " + thieu.join(",") : "du truong chinh"}`);
  }

  if (!process.argv.includes("--ghi")) { console.log("\n(xem thu — them --ghi de ghi vao san-pham-data.json)"); return; }

  const f = path.join(ROOT, "san-pham-data.json");
  const data = JSON.parse(fs.readFileSync(f, "utf8"));
  const co = new Set(data.sanPham.map((s) => s.slug));
  const them = moi.filter((s) => !co.has(s.slug));
  data.sanPham.push(...them);
  data.capNhat = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(f, JSON.stringify(data, null, 1), "utf8");
  console.log(`\nDA GHI ${them.length} mon vao san-pham-data.json (tong ${data.sanPham.length})`);
}
main();
