#!/usr/bin/env node
/**
 * build-san-pham.mjs — dựng trang sản phẩm tĩnh san-pham/<slug>.html từ san-pham-data.json.
 *
 * VÌ SAO CÓ (15/08/2026): tìm "đạm thực vật" hay "trà tuệ minh" trên Google không ra trang nào của
 * IKI. Một phần lý do là website KHÔNG HỀ CÓ trang riêng cho từng sản phẩm — sitemap chỉ có
 * /san-pham.html gộp chung, còn /shop/ dựng danh sách bằng JavaScript nên máy tìm kiếm và các
 * công cụ AI gần như không đọc được từng món. Truy vấn tên sản phẩm vì thế không có đích để đến.
 *
 * Ba thứ trang này làm mà trang gộp không làm được:
 *  1. Một URL bền cho mỗi sản phẩm, tên sản phẩm nằm trong <title>, <h1> và canonical.
 *  2. JSON-LD Product + Offer (giá, đơn vị tiền, tình trạng bán) — đây là dạng dữ liệu mà cả Google
 *     lẫn các công cụ trả lời bằng AI đọc để biết "sản phẩm này là gì, giá bao nhiêu, của ai".
 *  3. JSON-LD FAQPage: câu hỏi - trả lời viết sẵn dưới dạng máy đọc được, là thứ hay được trích
 *     nguyên văn khi người ta hỏi trợ lý AI.
 *
 * CỐ Ý KHÔNG gắn aggregateRating: chưa có đánh giá thật thì bịa sao là làm giả bằng chứng, vi phạm
 * chính sách Google và vi phạm chính rào pháp lý của mình. Có đánh giá thật rồi hãy thêm.
 *
 * Chạy: node scripts/build-san-pham.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { header, footer } from "./build-structure.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://ikihealing.com";
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "san-pham-data.json"), "utf8"));

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
const tien = (n) => Number(n).toLocaleString("vi-VN") + "đ";

/**
 * CỬA KIỂM PHÁP LÝ ngay trong máy dựng trang. Trang sản phẩm là chỗ rủi ro nhất của cả website —
 * nó vừa mang tên sản phẩm vừa mang giá, nên pháp luật đọc nó như quảng cáo thực phẩm bổ sung chứ
 * không như bài kiến thức. Chặn tại đây thì một lần sửa dữ liệu ẩu không thể lên thẳng trang thật.
 */
const TU_CAM = [
  "chữa bệnh", "trị bệnh", "điều trị", "khỏi bệnh", "đặc trị", "thải độc", "giải độc",
  "mát gan", "hạ huyết áp", "hạ đường huyết", "giảm mỡ máu", "kháng khuẩn", "diệt khuẩn",
  "thực phẩm chức năng", "tpcn", "phòng ngừa ung thư", "thuốc bổ",
];
function soiTuCam(text, ten) {
  const t = text.toLowerCase();
  const dinh = TU_CAM.filter((w) => t.includes(w));
  // "hiệu quả sau 7 ngày", "sau 2 tuần thấy..." — hứa mốc kết quả.
  if (/(hiệu quả|kết quả|cải thiện|thấy rõ)[^.]{0,25}(sau|trong)\s*\d+\s*(ngày|tuần|tháng)/i.test(text)) {
    dinh.push("hứa mốc kết quả");
  }
  if (dinh.length) throw new Error(`[${ten}] dính rào pháp lý: ${dinh.join(", ")}`);
}

function head(sp, url, ld) {
  const anhUrl = `${SITE}/assets/san-pham/${sp.anh}`;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <script id="iki-consent-default">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});</script><script src="/assets/dong-y-cookie.js" defer data-lang="vi"></script>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-N23BLRJD');</script>
  <!-- End Google Tag Manager -->
  <meta charset="UTF-8" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9X3LTTL2N3"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9X3LTTL2N3');gtag('config','AW-18332022859');</script>
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(sp.seoTitle)}</title>
  <meta name="description" content="${escAttr(sp.moTa)}" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="vi" href="${url}" />
  <link rel="alternate" hreflang="x-default" href="${url}" />
  <meta property="og:type" content="product" />
  <meta property="og:locale" content="vi_VN" />
  <meta property="og:site_name" content="IKI Healing — by HOPE CORP" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escAttr(sp.h1)}" />
  <meta property="og:description" content="${escAttr(sp.moTa)}" />
  <meta property="og:image" content="${anhUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(sp.h1)}" />
  <meta name="twitter:description" content="${escAttr(sp.moTa)}" />
  <meta name="twitter:image" content="${anhUrl}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/jpeg" href="../iki-logo-256.jpg" />
  <link rel="stylesheet" href="../styles.css" />
  <script src="../script.js" defer></script>
${ld.map((o) => `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`).join("\n")}
  <style>
    .sp-wrap{max-width:1080px;margin:0 auto;padding:34px 20px 10px}
    .sp-crumb{font-size:.86rem;color:#667085;margin-bottom:18px}
    .sp-crumb a{color:#2E8975;text-decoration:none;font-weight:600}
    .sp-top{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:38px;align-items:start}
    @media(max-width:820px){.sp-top{grid-template-columns:1fr;gap:24px}}
    .sp-anh{background:#F7FAF6;border:1px solid #e6ece3;border-radius:20px;padding:18px;text-align:center}
    .sp-anh img{max-width:100%;height:auto;border-radius:12px}
    .sp-eyebrow{color:#2E8975;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.78rem}
    .sp-top h1{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:clamp(1.8rem,4vw,2.7rem);margin:.35rem 0 .6rem;line-height:1.2}
    .sp-gia{font-size:1.7rem;font-weight:800;color:#1d2430;margin:6px 0 4px}
    .sp-gia small{display:block;font-size:.8rem;font-weight:500;color:#667085;margin-top:2px}
    .sp-mota{color:#475467;font-size:1.05rem;line-height:1.7;margin:12px 0 20px}
    .sp-cta{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0 8px}
    .sp-btn{display:inline-block;padding:14px 26px;border-radius:999px;font-weight:700;text-decoration:none;font-size:1rem}
    .sp-btn.chinh{background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB));color:#fff}
    .sp-btn.phu{background:#fff;color:#2E8975;border:1.5px solid #A8D254}
    .sp-body{max-width:820px;margin:0 auto;padding:8px 20px 20px;font-size:1.07rem;line-height:1.78;color:#1d2430}
    .sp-body h2{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:clamp(1.45rem,3vw,2rem);margin:2.1rem 0 .7rem}
    .sp-body p{margin:0 0 1.05rem} .sp-body ol,.sp-body ul{margin:0 0 1.1rem;padding-left:22px} .sp-body li{margin:.4rem 0}
    .sp-body a{color:#2E8975;font-weight:600}
    /* Bảng phải cuộn ngang được: màn hình điện thoại hẹp hơn bảng 2 cột có chữ dài. */
    .sp-body table{display:block;overflow-x:auto;width:100%;border-collapse:collapse;margin:1.3rem 0;font-size:.99rem}
    .sp-body th,.sp-body td{border:1px solid #e3e8ef;padding:10px 13px;text-align:left;vertical-align:top}
    .sp-body th{background:#F4F8EC;font-weight:700;white-space:nowrap}
    .sp-luu-y{background:#FFF8E8;border-left:5px solid #F5C518;border-radius:12px;padding:16px 20px;margin:26px 0;font-size:.98rem;color:#5c4a12}
    .sp-med{background:#F4F6F8;border-radius:12px;padding:14px 18px;margin:22px 0;font-size:.9rem;color:#475467}
    .sp-faq details{border:1px solid #e6e9ee;border-radius:12px;padding:12px 16px;margin:10px 0;background:#fff}
    .sp-faq summary{font-weight:700;cursor:pointer}
    .sp-faq p{margin:.6rem 0 0;color:#475467}
    .sp-doc-them{background:#F7FAF6;border-radius:16px;padding:20px 24px;margin:30px 0}
    .sp-doc-them ul{margin:8px 0 0;padding-left:20px}
  </style>
</head>
<body>
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N23BLRJD" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

function trang(sp) {
  const url = `${SITE}/san-pham/${sp.slug}.html`;
  const anhUrl = `${SITE}/assets/san-pham/${sp.anh}`;

  const ldProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: sp.tenDayDu,
    image: [anhUrl],
    description: sp.moTa,
    category: sp.loai,
    brand: { "@type": "Brand", name: "IKI" },
    manufacturer: { "@type": "Organization", name: "Công ty Cổ phần TMDV HOPE", taxID: "0801404967" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "VND",
      price: String(sp.gia),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Công ty Cổ phần TMDV HOPE" },
    },
  };
  const ldFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sp.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const ldCrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Sản phẩm", item: `${SITE}/san-pham.html` },
      { "@type": "ListItem", position: 3, name: sp.ten, item: url },
    ],
  };

  const bang = sp.thongTinNhanh.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");
  const dung = sp.cachDung.map((b) => `<li>${esc(b)}</li>`).join("");
  const faq = sp.faq
    .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join("\n        ");
  const doc = sp.baiLienQuan
    .map(([s, t]) => `<li><a href="../blog/${s}.html">${esc(t)}</a></li>`)
    .join("\n          ");

  return `${head(sp, url, [ldProduct, ldFaq, ldCrumb])}
${header()}
  <main>
    <div class="sp-wrap">
      <nav class="sp-crumb" aria-label="Đường dẫn"><a href="../index.html">Trang chủ</a> &rsaquo; <a href="../san-pham.html">Sản phẩm</a> &rsaquo; ${esc(sp.ten)}</nav>
      <div class="sp-top">
        <div class="sp-anh"><img src="../assets/san-pham/${sp.anh}" alt="${escAttr(sp.anhAlt)}" width="1000" height="1000" loading="eager" /></div>
        <div>
          <span class="sp-eyebrow">${esc(sp.loai)}</span>
          <h1>${esc(sp.h1)}</h1>
          <div class="sp-gia">${tien(sp.gia)}<small>Giá niêm yết · ${esc(sp.quyCach)}</small></div>
          <p class="sp-mota">${esc(sp.moTa)}</p>
          <div class="sp-cta">
            <a class="sp-btn chinh" href="../shop/?sp=${sp.slug}">Xem trong cửa hàng</a>
            <a class="sp-btn phu" href="../quiz/">Làm bài đọc thể trạng miễn phí</a>
          </div>
          <p style="font-size:.86rem;color:#667085;margin:6px 0 0">Giao hàng toàn quốc, nhận hàng trả tiền hoặc chuyển khoản trước.</p>
        </div>
      </div>
    </div>

    <article class="sp-body">
      <h2>Thông tin nhanh</h2>
      <table><tbody>${bang}</tbody></table>

      <h2>Thành phần và điểm đáng chú ý</h2>
      <p>${esc(sp.thanhPhanText)}</p>

      <h2>Cách dùng</h2>
      <ol>${dung}</ol>

      <h2>Bảo quản</h2>
      <p>${esc(sp.baoQuan)}</p>

      <div class="sp-luu-y"><strong>Lưu ý:</strong> ${esc(sp.luuY)}</div>

      <h2 id="faq">Câu hỏi thường gặp</h2>
      <div class="sp-faq">
        ${faq}
      </div>

      <div class="sp-doc-them">
        <strong>Đọc thêm trên blog IKI</strong>
        <ul>
          ${doc}
        </ul>
      </div>

      <div class="sp-med">Đây là <strong>thực phẩm bổ sung</strong>, không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh. Nội dung trên trang là thông tin sản phẩm và gợi ý chăm sóc sức khoẻ chủ động, không nhằm chẩn đoán hay điều trị bệnh. Người có bệnh nền, đang mang thai, đang cho con bú hoặc đang dùng thuốc nên hỏi ý kiến bác sĩ trước khi dùng.</div>
    </article>
  </main>
${footer()}
</body>
</html>`;
}

function main() {
  const dir = path.join(ROOT, "san-pham");
  fs.mkdirSync(dir, { recursive: true });
  const ra = [];
  for (const sp of DATA.sanPham) {
    // Soi TOÀN BỘ chữ sẽ hiện ra trang, gồm cả FAQ — thêm trường mới mà quên soi là mở một
    // đường vòng qua rào pháp lý, đúng bài học đã trả giá với trường lamNgay của blog.
    const moiChu = [
      sp.h1, sp.seoTitle, sp.moTa, sp.thanhPhanText, sp.baoQuan, sp.luuY,
      ...sp.cachDung, ...sp.thongTinNhanh.flat(), ...sp.faq.map((f) => `${f.q} ${f.a}`),
    ].join("\n");
    soiTuCam(moiChu, sp.ten);

    const f = path.join(dir, `${sp.slug}.html`);
    fs.writeFileSync(f, trang(sp), "utf8");
    ra.push(sp.slug);
    console.log(`  OK  san-pham/${sp.slug}.html — ${sp.ten} (${tien(sp.gia)})`);
  }

  // Sitemap: thêm URL mới, không đụng URL cũ.
  const smPath = path.join(ROOT, "sitemap.xml");
  let sm = fs.readFileSync(smPath, "utf8");
  let them = 0;
  for (const slug of ra) {
    const loc = `${SITE}/san-pham/${slug}.html`;
    if (sm.includes(loc)) continue;
    sm = sm.replace(
      /<\/urlset>/,
      `  <url><loc>${loc}</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>\n</urlset>`
    );
    them++;
  }
  if (them) fs.writeFileSync(smPath, sm, "utf8");
  console.log(`  sitemap.xml: thêm ${them} URL`);
}

main();
