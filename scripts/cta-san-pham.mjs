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
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "san-pham-data.json"), "utf8"));
export const MOC = "<!-- cta-san-pham -->";

const boDau = (s) =>
  (s || "").replace(/Đ/g, "D").replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Chọn sản phẩm hợp bài. Trà Thanh Hương xét TRƯỚC vì nó là nhánh hẹp (buổi tối, thư giãn);
 * xét sau thì mọi bài về trà đều rơi hết vào Tuệ Minh.
 */
const LUAT = [
  ["tra-thanh-huong", /(khong |khong co )?caffeine|buoi toi|truoc khi ngu|mat ngu|kho ngu|giac ngu|thu gian|thanh huong|hoa nhai/],
  ["tra-tue-minh", /\btra\b|thao moc|tui loc|tue minh|nuoc uong|thuc uong/],
  ["true-vegan-protein", /\bdam\b|protein|thuan chay|an chay|whey|co bap|van dong|bua sang|bua phu|dinh duong|hat va dau|nang luong/],
];

export function chonSanPham(fm = {}) {
  const chu = boDau([fm.title, fm.seo_title, fm.keyword, fm.description, fm.category, fm.slug].filter(Boolean).join(" "));
  for (const [slug, re] of LUAT) if (re.test(chu)) return DATA.sanPham.find((p) => p.slug === slug);
  // Không khớp luật nào thì lấy sản phẩm chủ lực — 68% doanh thu ba tháng gần nhất.
  return DATA.sanPham.find((p) => p.slug === "true-vegan-protein");
}

const tien = (n) => n.toLocaleString("vi-VN") + "đ";

/** goc: "../" khi gọi từ bài trong /blog (bài nằm cùng cấp thư mục blog). */
export function ctaSanPham(fm = {}, goc = "../") {
  const p = chonSanPham(fm);
  if (!p) return "";
  return `${MOC}
        <aside class="cta-sp" aria-label="Sản phẩm IKI">
          <div class="cta-sp-anh"><img src="${goc}assets/san-pham/${p.anh}" alt="${p.anhAlt || p.tenDayDu}" loading="lazy" width="160" height="160" /></div>
          <div class="cta-sp-chu">
            <span class="cta-sp-nhan">Thực phẩm bổ sung IKI</span>
            <h3>${p.tenDayDu}</h3>
            <p class="cta-sp-thongso">${p.quyCach} · ${tien(p.gia)}</p>
            <p class="cta-sp-mo">${p.moTa}</p>
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
    .cta-sp-chinh,.cta-sp-phu{display:inline-block;border-radius:30px;padding:11px 22px;font-weight:700;font-size:.95rem;text-decoration:none}
    .cta-sp-chinh{background:#1F4D1F;color:#fff;border:2px solid #1F4D1F}
    .cta-sp-phu{background:transparent;color:#1F4D1F;border:2px solid rgba(31,77,31,.35)}
    .cta-sp-chinh:hover{background:#2E6B2D;border-color:#2E6B2D}
    .cta-sp-phu:hover{border-color:#1F4D1F}
    @media(max-width:640px){.cta-sp{padding:20px}.cta-sp-anh img{width:110px;height:110px}}`;
