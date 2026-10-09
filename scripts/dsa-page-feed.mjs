#!/usr/bin/env node
/**
 * dsa-page-feed.mjs — sinh FEED TRANG cho Google Ads Dynamic Search Ads (DSA).
 *
 * VÌ SAO CÓ (09/10/2026, sau webinar SEO/GEO 08/10 — anh Định, Cro.com.vn): DSA cho Google tự đọc
 * từng trang rồi tự bắt từ khoá + tự viết tiêu đề quảng cáo, CPC thấp vì đánh vào cả nghìn truy vấn
 * dài mà không ai đấu giá. Muốn DSA chạy đúng thì phải đưa cho Google ĐÚNG danh sách trang được
 * phép quảng cáo, gắn nhãn tầng phễu để tách ngân sách: đáy (trang sản phẩm) chạy trước, giữa
 * (bài so sánh/chọn) sau, đỉnh (bài kiến thức) cuối — "quy trình X" của buổi đó.
 *
 * CỐ Ý LOẠI:
 *  - danh mục `cam-nang-suc-khoe` (bài về bệnh): quảng cáo kéo người đang lo bệnh vào trang của một
 *    hãng thực phẩm bổ sung là đúng thứ Google Ads (chính sách y tế) và luật QC TPBS soi; các bài này
 *    vốn đã tắt nút mua (`no_product`).
 *  - trang chính sách, giới thiệu, đội ngũ, khảo sát, bản en/ja (DSA tiếng Việt).
 *  - slug đã gỡ bằng chuyển hướng (chuyen-huong.json).
 * Nguồn URL là sitemap.xml (trang noindex vốn không có trong sitemap) — trang không có trong
 * sitemap thì không vào feed.
 *
 * Chạy: node scripts/dsa-page-feed.mjs   → ghi data/dsa-page-feed.csv (cột "Page URL","Custom label")
 * Tải file lên: Google Ads > Công cụ > Thư viện dùng chung > Dữ liệu kinh doanh > Nguồn cấp dữ liệu trang.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ikihealing.com";

// Bài GIỮA phễu = bài so sánh / chọn / phân biệt. Cố ý KHÔNG tính "nên ăn gì" (bài triệu chứng, đầu phễu).
export const MOFU = /(khac-nhau|so-sanh|loai-nao|cach-chon|(^|\/)(vi-sao-)?chon-|phan-biet|thay-the|-hay-[a-z-]*-(nao|tot))/;

// Chủ đề NHẠY CẢM với chính sách quảng cáo y tế (thuốc, thai sản, trẻ em, tên bệnh): vẫn vào feed
// nhưng gắn thêm nhãn "nhay-cam" để loại bằng một quy tắc trong Google Ads — khuyên LOẠI.
export const NHAY_CAM = /(^|[\/-])(khang-sinh|thuoc|vaccine|tiem|mang-thai|ba-bau|sau-sinh|cho-con-bu|cho-tre|tre-em|tre-nho|benh|ung-thu|tieu-duong|huyet-ap|mo-mau|gan|da-day|tuyen-giap|noi-tiet|kinh-nguyet|hien-mau)(?=[-.\/]|$)|\/blog\/tre-/;

// Trà Tuệ Minh đã gỡ khỏi truyền thông (MKT-06 lô B, TH duyệt 03/10/2026 — xem chan-tue-minh.mjs).
const GO_TUE_MINH = /tue-minh|tra-thao-duoc-5-vi/;

/** Tầng phễu suy từ đường dẫn — CÙNG quy tắc với `tangPheu` ở hope-ops-hub lib/nguon-lead-server.ts. */
export function tangPheu(p) {
  const s = p.toLowerCase();
  if (/^\/?(san-pham|shop|quiz)/.test(s)) return "bofu";
  if (MOFU.test(s)) return "mofu";
  if (/^\/?(blog|tai-lieu)\//.test(s)) return "tofu";
  return "";
}

const LOAI_TRANG = /^\/(en|ja|khao-sat)\/|^\/(chinh-sach|du-lieu|team|ve-hope|cong-nghe|cong-dong|404)/;

export function lapFeed({ sitemapXml, plan, chuyenHuong }) {
  const camNang = new Set(plan.articles.filter((a) => a.category === "cam-nang-suc-khoe").map((a) => a.slug));
  const daGo = new Set(Object.keys(chuyenHuong || {}));
  const dong = [];
  const boQua = { camNang: 0, khac: 0 };
  for (const [, url] of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const p = url.replace(SITE, "") || "/";
    if (LOAI_TRANG.test(p)) { boQua.khac++; continue; }
    const slug = (p.match(/^\/blog\/([^/]+?)(\.html)?$/) || [])[1];
    if (slug && (camNang.has(slug) || daGo.has(slug))) { boQua.camNang++; continue; }
    if (GO_TUE_MINH.test(p)) { boQua.khac++; continue; }
    const tang = tangPheu(p);
    if (!tang) { boQua.khac++; continue; }
    dong.push({ url, tang: NHAY_CAM.test(p) ? `${tang};nhay-cam` : tang });
  }
  return { dong, boQua };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sitemapXml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "content-plan.json"), "utf8"));
  const fCH = path.join(ROOT, "chuyen-huong.json");
  const chuyenHuong = fs.existsSync(fCH) ? JSON.parse(fs.readFileSync(fCH, "utf8")) : {};
  const { dong, boQua } = lapFeed({ sitemapXml, plan, chuyenHuong });
  if (!dong.length) { console.error("Feed rỗng — sitemap hỏng? Không ghi file."); process.exit(1); }
  const csv = ['"Page URL","Custom label"', ...dong.map((d) => `"${d.url}","${d.tang}"`)].join("\n") + "\n";
  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "data/dsa-page-feed.csv"), csv);
  const dem = dong.reduce((m, d) => { for (const n of d.tang.split(";")) m[n] = (m[n] || 0) + 1; return m; }, {});
  console.log(`data/dsa-page-feed.csv: ${dong.length} trang`, dem, `| loại bài bệnh/đã gỡ: ${boQua.camNang}, loại trang khác: ${boQua.khac}`);
}
