#!/usr/bin/env node
/**
 * Sinh feed danh mục sản phẩm cho Pinterest Catalogs.
 *
 * NGUỒN DUY NHẤT là mảng PRODUCTS trong shop/index.html — đúng thứ khách đang thấy
 * trên ikihealing.com/shop. Đừng chép danh sách sản phẩm sang file khác rồi để nó
 * lệch dần (bài học kho DISC: cùng một dữ liệu nằm hai nơi là sớm muộn nói hai kiểu).
 *
 * Đầu ra: pinterest-feed.csv + pinterest-feed.tsv ở gốc repo
 *   -> https://ikihealing.com/pinterest-feed.csv
 *
 * BA CHỐT, đừng gỡ:
 *  1. Chữ đi ra Pinterest (tiêu đề + mô tả) phải qua CỬA TỪ CẤM. Dính thì DỪNG cả lượt,
 *     không tự sửa hộ — sửa ở shop/index.html rồi chạy lại.
 *  2. Sản phẩm trong DANH_SACH_LOAI không vào feed (rủi ro chính sách Pinterest).
 *  3. Ảnh phải là URL tuyệt đối. Ảnh nội bộ tự gắn tiền tố ikihealing.com.
 *
 * Chạy: node scripts/pinterest-feed.mjs [--xem]
 */
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIEN = "https://ikihealing.com";

// Máy KHÔNG tự đưa mấy món này lên Pinterest — xem ghi chú từng dòng.
const DANH_SACH_LOAI = {
  "mang-hap-thu-song-dien-tu-eco-g9":
    "Pinterest hạn chế sản phẩm nêu công dụng sức khoẻ chưa có căn cứ; đưa lên dễ bị từ chối cả danh mục. Chờ CEO chốt.",
};

// Danh mục Google taxonomy (chuỗi chuẩn, Pinterest nhận). Bỏ trống còn hơn điền sai.
const NHOM = {
  dam: ["Thực phẩm bổ sung", "Health & Beauty > Health Care > Fitness & Nutrition > Nutritional Supplements"],
  tra: ["Trà thảo mộc", "Food, Beverages & Tobacco > Beverages > Tea & Infusions"],
  caphe: ["Cà phê", "Food, Beverages & Tobacco > Beverages > Coffee"],
  dau: ["Dầu ăn và nước chấm", "Food, Beverages & Tobacco > Food Items > Cooking & Baking Ingredients"],
  giavi: ["Gia vị", "Food, Beverages & Tobacco > Food Items > Seasonings & Spices"],
  thucduong: ["Đồ thực dưỡng", "Food, Beverages & Tobacco > Food Items"],
  khac: ["Khác", ""],
};

// Từ giữ nguyên chữ hoa khi chuẩn hoá tiêu đề (tên riêng, thương hiệu, mã).
const GIU_HOA = new Set([
  "IKI", "HOPE", "SADHU", "HANUTI", "SUDANTA", "ECO", "G9", "RAW", "VIRGIN",
  "COCONUT", "OIL", "TRUE", "VEGAN", "PROTEIN", "PRO", "AQUAMIN",
]);

function slugHoa(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Tên sản phẩm trên shop viết hoa lung tung ("MÈ ĐEN HỮU CƠ..."), Pinterest hiện
 * nguyên xi nên phải nắn. Luật: từ nào ĐANG VIẾT HOA TOÀN BỘ mà không phải tên
 * riêng thì hạ về chữ thường, rồi hoa chữ cái đầu của cả tên. Quy cách (500G,
 * 1L, 150G/320G) chuẩn hoá riêng vì "500G" đọc ra rất chướng.
 */
function nanQuyCach(tu) {
  return tu.replace(/(\d+(?:[.,]\d+)?)\s*(KG|G|ML|L)\b/gi, (_, so, dv) => {
    const d = dv.toUpperCase();
    return so + (d === "L" ? "L" : d.toLowerCase());
  });
}

function nanTieuDe(ten) {
  const nan = String(ten)
    .split(/(\s+)/)
    .map((tu) => {
      if (/^\s+$/.test(tu)) return tu;
      const loi = tu.replace(/[^\p{L}\p{N}]/gu, "");
      if (!loi) return tu;
      if (GIU_HOA.has(loi.toUpperCase())) return nanQuyCach(tu.toUpperCase());
      const toanHoa = loi.length > 1 && loi === loi.toUpperCase() && loi !== loi.toLowerCase();
      return nanQuyCach(toanHoa ? tu.toLowerCase() : tu);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return nan.replace(/\p{L}/u, (c) => c.toUpperCase());
}

function anhTuyetDoi(img) {
  const s = String(img || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return MIEN + (s.startsWith("/") ? s : "/" + s);
}

function docSanPham() {
  const html = readFileSync(join(GOC, "shop", "index.html"), "utf8");
  const m = html.match(/const PRODUCTS=(\[[\s\S]*?\]);/);
  if (!m) throw new Error("Không tìm thấy mảng PRODUCTS trong shop/index.html — /shop đã đổi cấu trúc?");
  const ds = JSON.parse(m[1]);
  if (!Array.isArray(ds) || !ds.length) throw new Error("PRODUCTS rỗng — dừng, không ghi feed rỗng đè bản cũ.");
  return ds;
}

function oCsv(v) {
  const s = String(v ?? "").replace(/\r?\n/g, " ").trim();
  return '"' + s.replace(/"/g, '""') + '"';
}
function oTsv(v) {
  return String(v ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

const COT = [
  "id", "title", "description", "link", "image_link",
  "price", "availability", "condition", "brand",
  "product_type", "google_product_category",
];

async function main() {
  const xemThoi = process.argv.includes("--xem");
  const { lyDoTuCam } = await import(
    "file://" + join(process.env.HOME, "Downloads/HOPE CORP/hope-ops-hub/scripts/lib/tu-cam.mjs")
  );

  const sanPham = docSanPham();
  const dong = [];
  const boQua = [];
  const viPham = [];

  for (const p of sanPham) {
    const id = slugHoa(p.n);
    if (DANH_SACH_LOAI[id]) {
      boQua.push([p.n, DANH_SACH_LOAI[id]]);
      continue;
    }
    const title = nanTieuDe(p.n);
    const description = String(p.desc || p.t || "").trim();

    // Cửa từ cấm chạy trên ĐÚNG chữ sẽ đi ra Pinterest.
    const ly = lyDoTuCam(title + " \n " + description);
    if (ly && ly.length) {
      viPham.push([p.n, ly.join(" · ")]);
      continue;
    }

    const anh = anhTuyetDoi(p.img);
    if (!anh) { boQua.push([p.n, "thiếu ảnh"]); continue; }
    if (!Number.isFinite(p.price) || p.price <= 0) { boQua.push([p.n, "thiếu giá"]); continue; }

    const [loai, gpc] = NHOM[p.cat] || NHOM.khac;
    dong.push({
      id,
      title,
      description,
      link: `${MIEN}/shop/?sp=${id}&utm_source=pinterest&utm_medium=catalog`,
      image_link: anh,
      price: `${p.price} VND`,
      availability: "in stock",
      condition: "new",
      brand: "IKI",
      product_type: loai,
      google_product_category: gpc,
    });
  }

  if (viPham.length) {
    console.error("DỪNG — chữ sẽ đi ra Pinterest còn dính rào pháp lý:");
    for (const [ten, ly] of viPham) console.error("  •", ten, "=>", ly);
    console.error("Sửa ở shop/index.html rồi chạy lại. Máy KHÔNG tự sửa hộ chữ bán hàng.");
    process.exit(1);
  }
  if (!dong.length) {
    console.error("DỪNG — 0 sản phẩm hợp lệ, không ghi feed rỗng đè bản cũ.");
    process.exit(1);
  }

  const csv = [COT.map(oCsv).join(",")]
    .concat(dong.map((d) => COT.map((c) => oCsv(d[c])).join(",")))
    .join("\n") + "\n";
  const tsv = [COT.join("\t")]
    .concat(dong.map((d) => COT.map((c) => oTsv(d[c])).join("\t")))
    .join("\n") + "\n";

  console.log(`Sản phẩm vào feed: ${dong.length}/${sanPham.length}`);
  for (const [ten, ly] of boQua) console.log("  bỏ qua:", ten, "—", ly);
  if (xemThoi) {
    console.log("\n--- xem thử 3 dòng đầu ---");
    console.log(csv.split("\n").slice(0, 4).join("\n"));
    return;
  }

  writeFileSync(join(GOC, "pinterest-feed.csv"), csv, "utf8");
  writeFileSync(join(GOC, "pinterest-feed.tsv"), tsv, "utf8");
  console.log(`\nĐã ghi pinterest-feed.csv (${csv.length} ký tự) và pinterest-feed.tsv`);
  console.log(`Khai vào Pinterest: ${MIEN}/pinterest-feed.csv`);
}

function laChayThang() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1] || "");
  } catch { return false; }
}
if (laChayThang()) main();
