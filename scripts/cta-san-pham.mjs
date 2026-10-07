#!/usr/bin/env node
/**
 * Khối CTA SẢN PHẨM cuối bài blog — nối phễu blog -> trang sản phẩm -> /shop.
 *
 * Vì sao có (họp chiến lược 18/08/2026): 300+ bài blog đang kéo traffic nhưng cuối bài chỉ có
 * đường xin email và đường vào quiz — KHÔNG có một đường mua hàng nào. Người đọc muốn mua cũng
 * không biết bấm vào đâu.
 *
 * LUẬT: chữ trong khối này CHỈ lấy từ san-pham-data.json (bản đã rà rào thực phẩm bổ sung).
 * Cấm viết công dụng mới ở đây. Cấm chữ "MUA NGAY" (quy chuẩn thiết kế IKI).
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "san-pham-data.json"), "utf8"));
export const MOC = "<!-- cta-san-pham -->";

const boDau = (s) =>
  (s || "").replace(/Đ/g, "D").replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/-/g, " ");

// Câu đã duyệt (MKT-06, TH 03/10/2026): chép từ file nguồn, kiểm băm khi chạy — lệch băm thì dừng, không gõ lại chữ.
const CAU_DUYET = JSON.parse(fs.readFileSync(path.join(ROOT, "data/cau-duyet-lo-b.json"), "utf8"));
export function cauDuyet(ma) {
  const c = CAU_DUYET[ma];
  if (!c) throw new Error(`thiếu câu đã duyệt ${ma} trong data/cau-duyet-lo-b.json`);
  const h = crypto.createHash("sha256").update(c.cau, "utf8").digest("hex");
  if (h !== c.sha256) throw new Error(`câu ${ma} lệch băm đã duyệt`);
  return c.cau;
}

// Giá trên thẻ LẤY TỪ API cửa hàng lúc build (T2: không gõ tay giá). API lỗi → dùng bản chụp
// data/gia-shop.json + cảnh báo; không có cả hai → build LỖI.
const API_GIA = "https://hope-ops-hub.vercel.app/api/shop/san-pham";
const FILE_GIA = path.join(ROOT, "data/gia-shop.json");
const TEN_API = { "true-vegan-protein": "true vegan protein pro", "tra-thanh-huong": "tra thanh huong", "tra-tue-minh": "tra tue minh" };
async function layGiaShop() {
  let chup = null;
  if (fs.existsSync(FILE_GIA)) chup = JSON.parse(fs.readFileSync(FILE_GIA, "utf8"));
  try {
    const r = await fetch(API_GIA, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ds = (await r.json()).sanPham || [];
    const gia = {};
    for (const [slug, ten] of Object.entries(TEN_API)) {
      const sp = ds.find((x) => boDau(x.n).includes(ten));
      if (sp && Number.isFinite(sp.price)) gia[slug] = sp.price;
    }
    if (!Object.keys(gia).length) throw new Error("API không có sản phẩm nào khớp");
    if (!chup || JSON.stringify(chup.gia) !== JSON.stringify(gia)) {
      chup = { _doc: "Bản chụp giá từ API cửa hàng, cta-san-pham.mjs tự ghi khi giá đổi. Không sửa tay.", nguon: API_GIA, layLuc: new Date().toISOString(), gia };
      fs.writeFileSync(FILE_GIA, JSON.stringify(chup, null, 2) + "\n");
    }
    return gia;
  } catch (e) {
    if (!chup) throw new Error(`Không lấy được giá từ API (${e.message}) và không có bản chụp data/gia-shop.json — dừng build, không gõ tay giá.`);
    console.warn(`  ! API giá lỗi (${e.message}) — dùng bản chụp data/gia-shop.json lấy lúc ${chup.layLuc}`);
    return chup.gia;
  }
}
const GIA = await layGiaShop();

/**
 * Chọn sản phẩm hợp bài (MKT-06 lô B, TH duyệt 03/10/2026, T2 bản SỬA):
 * - Bỏ hẳn luật Trà Tuệ Minh: không gắn thẻ Tuệ Minh vào bài blog nào.
 * - Thẻ Trà Thanh Hương CHỈ gắn bài về trà / thức uống.
 * - Bài về tình trạng sức khoẻ (tiêu đề/chủ đề có bệnh, triệu chứng) KHÔNG gắn thẻ sản phẩm nào
 *   (nền tảng thương hiệu v2 mục 9.3.1). Danh sách loại trừ dưới đây, so trên chữ bỏ dấu.
 */
// v2 9.3.1: tên bệnh / triệu chứng / tình trạng sức khoẻ — bài có các chữ này ở tiêu đề hoặc slug thì không gắn thẻ.
const LOAI_TRU_SUC_KHOE = /\bmat ngu\b|\bkho ngu\b|\bngu kem\b|\btran troc\b|\bday bung\b|\bkho tieu\b|\bchuong bung\b|\bnhiet mieng\b|\btien man kinh\b|\bman kinh\b|\btao bon\b|\btieu chay\b|\bda day\b|\btrao nguoc\b|\bnong trong\b|\bmun\b|\btri nho\b|\bhay quen\b|\bdau dau\b|\bdau khop\b|\bdau lung\b|\bhuyet ap\b|\btieu duong\b|\bduong huyet\b|\bmo mau\b|\bgan nhiem mo\b|\bgout\b|\bthieu mau\b|\bloang xuong\b|\broi loan\b|\bsuy giam\b|\bviem\b|\bbenh\b|\btrieu chung\b|\bnoi tiet\b|\brung toc\b/;
const LUAT_DAM = /\bdam\b|protein|thuan chay|an chay|whey|co bap|van dong|bua sang|bua phu|dinh duong|hat va dau|nang luong/;
// Trà/thức uống: chỉ xét TIÊU ĐỀ + slug (chủ đề bài), không xét mô tả — mô tả nhắc "trà" thoáng qua không làm bài thành bài về trà.
// "trà" xét trên chữ CÓ dấu để không lẫn "trả", "tra cứu", "kiểm tra".
const LUAT_TRA = /thao moc|tui loc|thuc uong|nuoc uong|do uong|thanh huong|hoa nhai|hoa que/;
const CO_CHU_TRA = /(^|[^\p{L}])trà($|[^\p{L}])/u;

// MKT soát PR #13 (06/10/2026): danh sách slug cố định — KHÔNG nới regex.
// CC-7 (4 bài trà nhạy cảm) + QĐ2 (10 bài triệu chứng regex bỏ sót) → không thẻ.
// MKT 14 + ranh giới 2 + TH C1 22 = 38 (TH CHỐT 06/10/2026).
const KHONG_THE = new Set([
  "ba-bau-uong-tra-thao-moc-duoc-khong", "tre-em-uong-tra-thao-moc-duoc-khong",
  "tra-de-ngu-mua-o-dau", "tra-hoa-cuc-co-tac-dung-gi-uong-luc-nao",
  "hay-tieu-dem-nen-uong-nuoc-the-nao", "nghien-rang-khi-ngu-nguyen-nhan-va-cach-cai-thien",
  "ngu-ngay-nguyen-nhan-va-cach-cai-thien", "ngu-day-bi-dang-mieng-kho-mieng",
  "ngu-day-mat-bi-sung", "hay-tinh-giac-luc-3-gio-sang-lam-sao-ngu-lai",
  "ngu-hay-nam-mo-nhieu-co-sao-khong", "cham-soc-da-dau-va-gau",
  "lanh-tay-chan-nen-an-gi", "an-gi-tot-cho-phoi-khi-khong-khi-o-nhiem",
  "ngu-du-8-tieng-van-met", "uong-dam-thuc-vat-co-hai-than-khong",
  "an-dam-cho-be-bat-dau-tu-dau", "an-gi-de-tang-chieu-cao-cho-tre", "an-sang-cho-tre-di-hoc",
  "bao-ve-mat-cho-tre-em", "lay-lai-nep-ngu-cho-tre-truoc-nam-hoc-moi", "sua-hat-cho-tre-may-tuoi-uong-duoc",
  "tang-suc-de-khang-cho-tre-nen-an-gi", "tre-bieng-an-phai-lam-sao", "tre-em-uong-dam-thuc-vat-duoc-khong",
  "ba-bau-uong-dam-thuc-vat-duoc-khong", "chuan-bi-mang-thai-nen-an-gi", "dinh-duong-cho-phu-nu-mang-thai",
  "me-cho-con-bu-nen-an-gi", "an-gi-de-tang-suc-de-khang-cho-nguoi-lon", "vitamin-c-va-de-khang",
  "chi-so-duong-huyet-thuc-pham", "nguoi-lon-tuoi-kho-nhai-nuot-nen-an-gi", "say-tau-xe-nen-an-gi",
  "an-gi-de-giam-cang-thang-lo-au", "quang-tham-mat-do-dau", "nguoi-gay-kho-tang-can-nen-an-gi",
  "cham-soc-mat-nguoi-lon-tuoi",
]);
// QĐ2: bài chủ đề đồ uống/trà → thẻ trà (L1 "Trà thảo mộc IKI"). TH mục B: chỉ chuyển 2.
const THE_TRA = new Set([
  "uong-gi-thay-ca-phe-buoi-sang", "nuoc-gao-lut-rang-co-tot-khong",
]);

export function chonSanPham(fm = {}) {
  const chuDe = boDau([fm.title, fm.seo_title, fm.keyword, fm.category, fm.slug].filter(Boolean).join(" "));
  const sp = (slug) => DATA.sanPham.find((p) => p.slug === slug);
  if (KHONG_THE.has(fm.slug)) return null;
  if (THE_TRA.has(fm.slug)) return sp("tra-thanh-huong");
  if (LOAI_TRU_SUC_KHOE.test(chuDe)) return null;
  if (LUAT_DAM.test(chuDe)) return sp("true-vegan-protein");
  const chuDeCoDau = [fm.title, fm.seo_title, fm.keyword, fm.category].filter(Boolean).join(" ").toLowerCase();
  if (LUAT_TRA.test(chuDe) || CO_CHU_TRA.test(chuDeCoDau)) return sp("tra-thanh-huong");
  // Không khớp chủ đề nào thì lấy sản phẩm chủ lực — 68% doanh thu ba tháng gần nhất.
  return sp("true-vegan-protein");
}

const tien = (n) => n.toLocaleString("vi-VN") + "đ";

/** goc: "../" khi gọi từ bài trong /blog (bài nằm cùng cấp thư mục blog). */
export function ctaSanPham(fm = {}, goc = "../") {
  const p = chonSanPham(fm);
  if (!p) return "";
  const gia = GIA[p.slug];
  if (!Number.isFinite(gia)) throw new Error(`không có giá API cho ${p.slug} — không gõ tay giá`);
  // T4: Đạm giữ nhãn "Thực phẩm bổ sung IKI" (đúng hồ sơ); trà luôn là L1, không bao giờ gọi là thực phẩm bổ sung.
  const nhan = p.slug === "true-vegan-protein" ? "Thực phẩm bổ sung IKI" : cauDuyet("L1");
  // T3: mô tả Đạm bỏ "thuần chay", "hộp 500g" → "hũ 500 g" (đúng hồ sơ).
  const moTa = p.slug === "true-vegan-protein" ? p.moTa.replace(/ thuần chay,/g, ",").replace(/hộp 500g/g, "hũ 500 g") : p.moTa;
  return `${MOC}
        <aside class="cta-sp" aria-label="Sản phẩm IKI">
          <div class="cta-sp-anh"><img src="${goc}assets/san-pham/${p.anh}" alt="${p.anhAlt || p.tenDayDu}" loading="lazy" width="160" height="160" /></div>
          <div class="cta-sp-chu">
            <span class="cta-sp-nhan">${nhan}</span>
            <h3>${p.tenDayDu}</h3>
            <p class="cta-sp-thongso">${p.quyCach} · ${tien(gia)}</p>
            <p class="cta-sp-mo">${moTa}</p>
            <div class="cta-sp-nut">
              <a class="cta-sp-chinh" href="${goc}san-pham/${p.slug}.html">Xem chi tiết sản phẩm</a>
              <a class="cta-sp-phu" href="${goc}shop/?sp=${p.slug}">Đặt hàng tại cửa hàng IKI</a>
            </div>
          </div>
        </aside>`;
}

export const CSS_CTA_SP = `
    .cta-sp{display:flex;gap:22px;align-items:center;flex-wrap:wrap;background:#F7F7F2;border:1px solid #E2E7DE;border-left:6px solid #2E6B2D;border-radius:18px;padding:24px 26px;margin:34px 0}
    .cta-sp-anh img{width:160px;height:160px;object-fit:contain;border-radius:12px;background:#fff}
    .cta-sp-chu{flex:1 1 320px;min-width:0}
    .cta-sp-nhan{display:inline-block;font-size:.7rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#2E6B2D;margin-bottom:6px}
    .cta-sp h3{font-size:1.22rem;margin:0 0 6px;color:#1F4D1F;line-height:1.35}
    .cta-sp-thongso{margin:0 0 8px;font-weight:700;color:#1F4D1F}
    .cta-sp-mo{margin:0 0 16px;color:#4A554A;font-size:.95rem;line-height:1.6}
    .cta-sp-nut{display:flex;gap:10px;flex-wrap:wrap}
    .cta-sp-chinh,.cta-sp-phu{display:inline-block;border-radius:8px;padding:11px 22px;font-weight:700;font-size:.95rem;text-decoration:none}
    .cta-sp-chinh{background:#1F4D1F;color:#fff;border:2px solid #1F4D1F}
    .cta-sp-phu{background:transparent;color:#1F4D1F;border:2px solid rgba(31,77,31,.35)}
    .cta-sp-chinh:hover{background:#2E6B2D;border-color:#2E6B2D}
    .cta-sp-phu:hover{border-color:#1F4D1F}
    @media(max-width:640px){.cta-sp{padding:20px}.cta-sp-anh img{width:110px;height:110px}}`;
