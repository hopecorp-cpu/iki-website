#!/usr/bin/env node
/**
 * seo-shop.mjs — VÁ THẺ SEO/GEO CHO TRANG /shop (vi + en + ja). CHẠY LẠI ĐƯỢC.
 *
 * Vì sao có (đo 03/09/2026): /shop là trang BÁN HÀNG nhưng thiếu hẳn `<meta name="description">`,
 * không một thẻ og:* nào và không có JSON-LD. Hậu quả: Google tự bịa đoạn mô tả, chia sẻ lên
 * Zalo/Facebook ra thẻ trắng không ảnh, và máy đọc (ChatGPT/Perplexity) không thấy đây là trang
 * bán hàng có sản phẩm gì.
 *
 * Giá và tên KHÔNG gõ tay — đọc thẳng từ mảng PRODUCTS trong chính file đó, nên đổi giá rồi chạy
 * lại là schema khớp luôn, không bao giờ lệch với cái khách nhìn thấy.
 *
 * Dùng: node scripts/seo-shop.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SITE = "https://ikihealing.com";
const ANH_MAC_DINH = `${SITE}/iki-logo-256.jpg`;

const BAN = [
  { thuMuc: "shop", lang: "vi", duong: "/shop/",
    moTa: "Cửa hàng IKI Healing: đạm thực vật True Vegan, trà thảo mộc và thức uống lành. Thực phẩm bổ sung, giao toàn quốc.",
    ten: "Cửa hàng IKI Healing" },
  { thuMuc: "en/shop", lang: "en", duong: "/en/shop/",
    moTa: "IKI Healing store: True Vegan plant protein, herbal teas and wholesome drinks. Food supplements, delivered across Vietnam.",
    ten: "IKI Healing Store" },
  { thuMuc: "ja/shop", lang: "ja", duong: "/ja/shop/",
    moTa: "IKI Healing ストア：植物性プロテイン True Vegan、ハーブティー、やさしい飲みもの。栄養補助食品です。",
    ten: "IKI Healing ストア" },
];

// Đọc mảng PRODUCTS bằng cách cắt đúng cặp ngoặc vuông rồi JSON.parse — không eval mã của trang.
function docSanPham(html) {
  const i = html.indexOf("const PRODUCTS");
  if (i < 0) return [];
  const dau = html.indexOf("[", i);
  let sau = dau, sau2 = 0, trongChuoi = false, thoat = false;
  for (; sau < html.length; sau++) {
    const c = html[sau];
    if (thoat) { thoat = false; continue; }
    if (c === "\\") { thoat = true; continue; }
    if (c === '"') { trongChuoi = !trongChuoi; continue; }
    if (trongChuoi) continue;
    if (c === "[") sau2++;
    else if (c === "]") { sau2--; if (!sau2) break; }
  }
  try { return JSON.parse(html.slice(dau, sau + 1)); } catch { return []; }
}

const MOC_DAU = "<!-- SEO:START (tự sinh bởi seo-shop.mjs — đừng sửa tay) -->";
const MOC_CUOI = "<!-- SEO:END -->";
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let tong = 0;
for (const b of BAN) {
  const p = path.join(ROOT, b.thuMuc, "index.html");
  if (!fs.existsSync(p)) { console.log(`  bỏ qua ${b.thuMuc} (không có file)`); continue; }
  let html = fs.readFileSync(p, "utf8");
  const sp = docSanPham(html);
  if (!sp.length) { console.error(`  ✗ ${b.thuMuc}: KHÔNG đọc được PRODUCTS — không ghi gì cho ${b.duong}`); continue; }

  const tieuDe = (html.match(/<title>([^<]*)<\/title>/i) || [, b.ten])[1].trim();
  const anh = sp.find((x) => x.img)?.img || ANH_MAC_DINH;
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: tieuDe,
    description: b.moTa,
    url: `${SITE}${b.duong}`,
    inLanguage: b.lang,
    isPartOf: { "@type": "WebSite", name: "IKI Healing", url: SITE },
    publisher: { "@type": "Organization", name: "Công ty Cổ phần TMDV HOPE", url: SITE },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: sp.length,
      itemListElement: sp.map((x, i) => ({
        "@type": "ListItem", position: i + 1,
        item: {
          "@type": "Product",
          name: x.n,
          ...(x.desc ? { description: x.desc } : {}),
          ...(x.img ? { image: x.img } : {}),
          brand: { "@type": "Brand", name: "IKI by HOPE CORP" },
          ...(x.price ? { offers: { "@type": "Offer", price: x.price, priceCurrency: "VND", availability: "https://schema.org/InStock", url: `${SITE}${b.duong}` } } : {}),
        },
      })),
    },
  };

  const khoi = [
    MOC_DAU,
    `<meta name="description" content="${esc(b.moTa)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="IKI Healing">`,
    `<meta property="og:locale" content="${b.lang === "vi" ? "vi_VN" : b.lang === "ja" ? "ja_JP" : "en_US"}">`,
    `<meta property="og:title" content="${esc(tieuDe)}">`,
    `<meta property="og:description" content="${esc(b.moTa)}">`,
    `<meta property="og:url" content="${SITE}${b.duong}">`,
    `<meta property="og:image" content="${esc(anh)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(tieuDe)}">`,
    `<meta name="twitter:description" content="${esc(b.moTa)}">`,
    `<meta name="twitter:image" content="${esc(anh)}">`,
    `<script type="application/ld+json">`,
    JSON.stringify(ld, null, 2),
    `</script>`,
    MOC_CUOI,
  ].join("\n");

  const re = new RegExp(`${MOC_DAU.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${MOC_CUOI.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (re.test(html)) html = html.replace(re, khoi);
  else {
    // Chèn ngay sau <title> để thẻ nằm gọn trong đầu tài liệu, không lẫn vào giữa mã.
    const m = html.match(/<title>[^<]*<\/title>/i);
    if (!m) { console.error(`  ✗ ${b.thuMuc}: không tìm thấy <title>, bỏ qua`); continue; }
    html = html.replace(m[0], `${m[0]}\n${khoi}`);
  }
  fs.writeFileSync(p, html, "utf8");
  tong++;
  console.log(`  ✓ ${b.duong} — ${sp.length} sản phẩm vào ItemList`);
}
console.log(tong ? `✓ đã vá thẻ SEO cho ${tong}/3 bản trang shop` : "✗ không vá được bản nào");
