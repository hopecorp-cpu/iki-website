#!/usr/bin/env node
/**
 * build-structure.mjs — Dựng trang CẤU TRÚC blog từ content-plan.json (mô hình lộ trình BeginGuru):
 *   - blog/index.html          (theo CHẶNG + nhãn tầng + sidebar danh mục + CTA email)
 *   - blog/danh-muc-<slug>.html (hub mỗi trụ: bài published + "sắp có" + CTA email)
 *   - blog/lo-trinh.html        (hub series lộ trình theo đối tượng)
 *   - blog/cam-on.html          (trang cảm ơn sau khi để lại email)
 *   - cập nhật vùng blog trong sitemap.xml
 *
 * CTA email tái dùng FormSubmit của site (→ contact@ikihealing.com; script.js tự chèn UTM).
 * Export buildStructure() + emailCta() cho build-article.mjs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://ikihealing.com";
// Lead magnet POST tới endpoint ops-hub (lưu lead + Resend welcome + drip). Trả về redirect cam-on.
// (Trước dùng FormSubmit trực tiếp; đổi sang ops-hub khi bật Resend 2026-07-21.)
const FORM_ACTION = "https://hope-ops-hub.vercel.app/api/blog-lead";

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
const clamp = (s, n) => { s = String(s || ""); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };

function loadPlan() { return JSON.parse(fs.readFileSync(path.join(ROOT, "content-plan.json"), "utf8")); }
function draftMeta(slug) {
  const p = path.join(ROOT, "blog-drafts", `${slug}.md`);
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, "utf8").match(/^---json\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}
const isPublished = (slug) => fs.existsSync(path.join(ROOT, "blog-drafts", `${slug}.md`));

// slug -> title (gộp articles + roadmaps) để render thẻ theo chặng
function titleMap(plan) {
  const map = {};
  for (const a of plan.articles) map[a.slug] = a.title;
  for (const g of plan.roadmaps) for (const it of g.items) if (!map[it.slug]) map[it.slug] = it.title;
  return map;
}

// ---- CTA email (lead magnet) — tái dùng khắp nơi ----
export function emailCta(plan, source) {
  const lm = plan.leadMagnet || {};
  return `<section class="lead-cta" aria-label="Nhận cẩm nang miễn phí">
    <div class="lead-inner">
      <span class="lead-tag">${esc(lm.tag || "Miễn phí")}</span>
      <h2>${esc(lm.title || "Nhận cẩm nang chăm sóc sức khoẻ chủ động")}</h2>
      <p>${esc(lm.sub || "Gửi thẳng vào email của bạn.")}</p>
      <form class="signup-form lead-form" action="${FORM_ACTION}" method="POST" novalidate>
        <input type="hidden" name="source" value="blog:${escAttr(source || "")}" />
        <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" />
        <div class="lead-row">
          <input type="email" name="email" placeholder="Email của bạn..." required aria-label="Email" />
          <button type="submit">${esc(lm.button || "Nhận ngay →")}</button>
        </div>
        <input type="tel" name="phone" class="lead-phone" placeholder="Số điện thoại (không bắt buộc — để được tư vấn thêm)" aria-label="Số điện thoại" />
        <label class="lead-consent"><input type="checkbox" name="consent" required /> Tôi đồng ý nhận nội dung chăm sóc sức khoẻ từ IKI. ${esc(lm.note || "Không spam.")}</label>
      </form>
    </div>
  </section>`;
}

function head(title, desc, canonical, ldExtra, noindex) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <!-- Google tag: GA4 + Google Ads (remarketing) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9X3LTTL2N3"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9X3LTTL2N3');gtag('config','AW-18332022859');</script>
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests; base-uri 'self'; object-src 'none'; form-action 'self' https://formsubmit.co https://formspree.io https://hope-ops-hub.vercel.app;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${noindex ? '<meta name="robots" content="noindex,follow" />\n  ' : ""}<title>${esc(title)}</title>
  <meta name="description" content="${escAttr(clamp(desc, 160))}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="vi" href="${canonical}" />
  <link rel="alternate" hreflang="x-default" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="vi_VN" />
  <meta property="og:site_name" content="IKI by HOPE CORP" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escAttr(title)}" />
  <meta property="og:description" content="${escAttr(clamp(desc, 160))}" />
  <meta property="og:image" content="${SITE}/assets/banners/iki-banner-1200x630-og.jpg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/jpeg" href="../iki-logo-256.jpg" />
  <link rel="stylesheet" href="../styles.css" />
  <script src="../script.js" defer></script>
${ldExtra ? `  <script type="application/ld+json">\n${JSON.stringify(ldExtra, null, 2)}\n  </script>` : ""}
  <style>
    .blog-hero{max-width:1100px;margin:0 auto;padding:44px 20px 8px;text-align:center}
    .blog-hero .eyebrow{color:var(--iki-teal-deep,#2E8975);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.8rem}
    .blog-hero h1{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:clamp(2rem,5vw,3.1rem);margin:.4rem 0 .5rem}
    .blog-hero p{color:#667085;max-width:640px;margin:0 auto;font-size:1.05rem}
    .cat-nav{max-width:1100px;margin:18px auto 0;padding:0 20px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
    .cat-nav a{font-size:.9rem;font-weight:600;color:#344054;background:#fff;border:1px solid #e4e7ec;border-radius:999px;padding:7px 16px;text-decoration:none}
    .cat-nav a:hover,.cat-nav a.active{background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB));color:#fff;border-color:transparent}
    .blog-search{max-width:620px;margin:18px auto 0;padding:0 20px;position:relative}
    .blog-search input{width:100%;border:1px solid #d0d5dd;border-radius:999px;padding:14px 22px;font-size:1rem;font-family:inherit;outline:none;box-shadow:0 1px 2px rgba(16,24,40,.04)}
    .blog-search input:focus{border-color:var(--iki-teal,#4BC0AB);box-shadow:0 0 0 3px rgba(75,192,171,.15)}
    .search-results{position:absolute;left:20px;right:20px;top:58px;background:#fff;border:1px solid #eef0f3;border-radius:14px;box-shadow:0 8px 28px rgba(16,24,40,.12);z-index:30;overflow:hidden}
    .search-results a,.search-results .sr-soon{display:block;padding:12px 18px;text-decoration:none;color:#101828;font-weight:600;border-bottom:1px solid #f2f4f7;font-size:.95rem}
    .search-results a:hover{background:#f6fbf9}
    .search-results .sr-soon{color:#98a2b3;font-weight:500}
    .search-results .sr-cat{display:block;font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975);margin-bottom:2px}
    .search-results .sr-empty{padding:16px 18px;color:#667085;font-size:.92rem}
    .age-section{max-width:1100px;margin:26px auto 6px;padding:0 20px}
    .age-head{text-align:center;margin-bottom:16px}
    .age-head h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.7rem;margin:0}
    .age-head p{color:#667085;margin:4px 0 0;font-size:.98rem}
    .age-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
    @media(max-width:760px){.age-grid{grid-template-columns:repeat(2,1fr)}}
    .age-card{position:relative;display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid #eef0f3;border-top:3px solid var(--iki-teal,#4BC0AB);border-radius:14px;padding:18px;text-decoration:none;color:inherit;box-shadow:0 1px 2px rgba(16,24,40,.04);transition:transform .15s,box-shadow .15s}
    .age-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(16,24,40,.10)}
    .age-card.soon{border-top-color:#d0d5dd;background:#fafbfc}
    .age-label{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975)}
    .age-card.soon .age-label{color:#98a2b3}
    .age-title{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:1.3rem;line-height:1.15}
    .age-soon{font-size:.64rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#98a2b3;background:#f2f4f7;border-radius:999px;padding:3px 8px;align-self:flex-start}
    .blog-layout{max-width:1140px;margin:0 auto;padding:24px 20px 10px;display:grid;grid-template-columns:1fr 320px;gap:36px;align-items:start}
    @media(max-width:900px){.blog-layout{grid-template-columns:1fr}}
    .chapter{margin-bottom:34px}
    .ch-head h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.7rem;margin:0 0 4px}
    .ch-head p{color:#667085;margin:0 0 16px;font-size:.98rem;line-height:1.5}
    .chip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
    .chip-card{display:block;background:#fff;border:1px solid #eef0f3;border-left:4px solid var(--iki-teal,#4BC0AB);border-radius:12px;padding:16px 18px;text-decoration:none;color:inherit;transition:transform .15s,box-shadow .15s}
    .chip-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(16,24,40,.08)}
    .chip-card.soon{border-left-color:#d0d5dd;background:#fafbfc;position:relative}
    .cc-tier{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975);margin-bottom:6px}
    .chip-card.soon .cc-tier{color:#98a2b3}
    .cc-title{font-weight:700;color:#101828;line-height:1.3;font-size:1.02rem}
    .cc-soon{position:absolute;top:14px;right:14px;font-size:.64rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#98a2b3;background:#f2f4f7;border-radius:999px;padding:3px 8px}
    .blog-side{position:sticky;top:84px;display:flex;flex-direction:column;gap:18px}
    .side-box{background:#fff;border:1px solid #eef0f3;border-radius:16px;padding:18px 20px}
    .side-title{font-weight:700;font-size:.8rem;letter-spacing:.05em;text-transform:uppercase;color:#475467;margin-bottom:10px}
    .side-cats ul{list-style:none;margin:0;padding:0}
    .side-cats li{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f2f4f7}
    .side-cats li:last-child{border-bottom:none}
    .side-cats a{color:#101828;text-decoration:none;font-weight:600;font-size:.95rem} .side-cats a:hover{color:var(--iki-teal-deep,#2E8975)}
    .side-cats span{color:#98a2b3;font-size:.82rem;font-weight:700;background:#f2f4f7;border-radius:999px;padding:2px 10px}
    .side-app{background:linear-gradient(135deg,#12261f,#1c3a30);color:#fff;border:none}
    .side-app .side-tag{color:var(--iki-lime,#A8D254);font-weight:700;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}
    .side-app .side-h{font-family:var(--font-display,'Cormorant Garamond');font-size:1.35rem;font-weight:700;margin:6px 0}
    .side-app p{color:rgba(255,255,255,.8);font-size:.9rem;margin:0 0 14px}
    .side-app .btn{display:inline-block}
    .lead-cta{max-width:1140px;margin:20px auto 50px;padding:0 20px}
    .lead-inner{background:linear-gradient(135deg,#12261f,#1c3a30);border-radius:22px;padding:40px 28px;text-align:center;color:#fff}
    .lead-cta .lead-tag{color:var(--iki-lime,#A8D254);font-weight:700;font-size:.74rem;letter-spacing:.1em;text-transform:uppercase}
    .lead-cta h2{font-family:var(--font-display,'Cormorant Garamond');font-size:clamp(1.6rem,3.4vw,2.3rem);margin:8px 0 6px;color:#fff}
    .lead-cta p{color:rgba(255,255,255,.82);margin:0 auto 20px;max-width:560px}
    .lead-row{display:flex;gap:10px;max-width:520px;margin:0 auto;flex-wrap:wrap}
    .lead-row input[type=email]{flex:1;min-width:200px;border:none;border-radius:12px;padding:14px 18px;font-size:1rem;font-family:inherit}
    .lead-phone{display:block;width:100%;max-width:520px;margin:10px auto 0;border:none;border-radius:12px;padding:12px 16px;font-size:.95rem;font-family:inherit}
    .lead-row button{border:none;border-radius:12px;padding:14px 24px;font-weight:700;font-size:1rem;color:#fff;background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB));cursor:pointer;font-family:inherit}
    .lead-row button:hover{opacity:.94}
    .lead-consent{display:block;margin-top:12px;color:rgba(255,255,255,.6);font-size:.8rem}
    .lead-consent input{margin-right:6px}
    /* hub grid (ảnh) */
    .cat-section{max-width:1100px;margin:0 auto;padding:20px}
    .blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px}
    .blog-card{display:flex;flex-direction:column;background:#fff;border:1px solid #eef0f3;border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 1px 2px rgba(16,24,40,.04),0 2px 10px rgba(16,24,40,.05);transition:transform .18s,box-shadow .18s}
    .blog-card:hover{transform:translateY(-3px);box-shadow:0 6px 22px rgba(16,24,40,.10)}
    .bc-img{aspect-ratio:16/9;background-size:cover;background-position:center;background-color:#eef2f0}
    .bc-body{padding:16px 18px 20px;display:flex;flex-direction:column;gap:7px}
    .bc-cat{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975)}
    .bc-title{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:1.3rem;line-height:1.2;margin:0}
    .bc-desc{color:#475467;font-size:.92rem;line-height:1.5;margin:0} .bc-meta{color:#98a2b3;font-size:.8rem;margin-top:3px}
    .soon-list{max-width:1100px;margin:6px auto 0;padding:0 20px}
    .soon-list h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.4rem;margin:24px 0 12px}
    .soon-list ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
    .soon-list li{background:#fafbfc;border:1px dashed #d0d5dd;border-radius:12px;padding:12px 16px;color:#475467;font-size:.92rem}
    .soon-list .tag{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#98a2b3;margin-right:8px}
    .rm-group{max-width:900px;margin:0 auto;padding:8px 20px 10px}
    .rm-group h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.6rem;margin:26px 0 4px} .rm-group p.d{color:#667085;margin:0 0 14px}
    .rm-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
    .rm-list li{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #eef0f3;border-radius:14px;padding:14px 18px}
    .rm-list a{font-weight:700;color:#101828;text-decoration:none} .rm-list a:hover{color:var(--iki-teal-deep,#2E8975)}
    .rm-list .st{margin-left:auto;font-size:.72rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border-radius:999px;padding:4px 10px}
    .rm-list .st.pub{background:#eafaf5;color:var(--iki-teal-deep,#2E8975)} .rm-list .st.soon{background:#f2f4f7;color:#98a2b3}
    .rm-list .dot{width:10px;height:10px;border-radius:50%;flex:0 0 auto} .rm-list .dot.pub{background:var(--iki-teal,#4BC0AB)} .rm-list .dot.soon{background:#d0d5dd}
  </style>
</head>
<body>`;
}

function header() {
  return `
  <div class="announcement-bar">App IKI — <a href="../app.html">iOS &amp; Android</a>. AI Coach Đông Y cá nhân hoá theo thể tạng.</div>
  <header class="site-header" id="site-header">
    <nav class="nav">
      <a class="brand" href="../index.html" aria-label="IKI Trang chủ"><img class="brand-logo" src="../iki-logo-256.jpg" alt="IKI logo" /><span>IKI <span class="brand-sub">By HOPE CORP</span></span></a>
      <button class="nav-toggle" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="primary-nav">
        <svg class="icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg class="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <ul class="nav-links" id="primary-nav">
        <li><a href="../index.html">Trang chủ</a></li>
        <li><a href="../hoc-vien.html">Học Viện</a></li>
        <li><a href="index.html" class="active">Blog</a></li>
        <li><a href="../cong-dong.html">Cộng đồng</a></li>
        <li><a href="https://www.ikihealingdetox.com" target="_blank" rel="noopener noreferrer">Sản phẩm ↗</a></li>
        <li><a href="../app.html">Ứng dụng</a></li>
      </ul>
    </nav>
  </header>`;
}

const footer = () => `
  <footer class="site-footer"><div class="container">
    <div class="footer-grid">
      <div><div class="footer-brand">IKI</div><p>Platform công nghệ wellness cho người Việt — kế thừa tri thức Y học Cổ truyền Việt Nam qua Tuệ Tĩnh và Hải Thượng Lãn Ông. Sản phẩm của Công ty Cổ phần TMDV HOPE (MST 0801404967). Cố vấn chuyên môn: TS. Ngô Đức Vượng.</p></div>
      <div><h4>Hệ sinh thái</h4><ul><li><a href="../hoc-vien.html">Học Viện IKI</a></li><li><a href="index.html">Blog IKI</a></li><li><a href="../cong-dong.html">Cộng đồng IKI</a></li><li><a href="../app.html">Ứng dụng IKI</a></li><li><a href="../ve-hope.html">Về HOPE CORP</a></li></ul></div>
      <div><h4>Trụ nội dung</h4><ul><li><a href="lo-trinh.html">Lộ trình chăm sóc</a></li><li><a href="danh-muc-dinh-duong.html">Dinh dưỡng &amp; ăn uống</a></li><li><a href="danh-muc-thoi-quen.html">Thói quen &amp; lối sống</a></li><li><a href="danh-muc-dong-y.html">Đông y &amp; dân gian</a></li></ul></div>
      <div><h4>Liên hệ</h4><ul class="contact-list"><li class="contact-item"><span class="contact-label">Email</span><a href="mailto:contact@ikihealing.com">contact@ikihealing.com</a></li><li class="contact-item"><span class="contact-label">Tư vấn</span><a href="tel:0987931551">0987.931.551</a></li></ul></div>
    </div>
    <div class="global-disclaimer"><p>Các sản phẩm là <strong style="color:rgba(255,255,255,0.78);">thực phẩm bổ sung</strong>, không phải thuốc và không có tác dụng thay thế thuốc chữa bệnh. Kết quả có thể khác nhau tuỳ cơ địa.</p></div>
    <div class="footer-bottom"><span>© 2026 Công ty Cổ phần TMDV HOPE — IKI là thương hiệu được sở hữu và vận hành bởi HOPE CORP.</span> <a href="mien-tru-trach-nhiem.html" style="color:rgba(255,255,255,0.7);text-decoration:underline">Miễn trừ trách nhiệm</a></div>
  </div></footer>
</body>
</html>
`;

function imgCard(a, catName) {
  const m = draftMeta(a.slug) || {};
  const img = m.hero_local ? `../${m.hero_local}` : (m.hero_image || "");
  const desc = (m.description || "").slice(0, 150);
  return `<a class="blog-card" href="${escAttr(a.slug)}.html"><div class="bc-img"${img ? ` style="background-image:url('${escAttr(img)}')"` : ""}></div><div class="bc-body"><span class="bc-cat">${esc(catName)}</span><h2 class="bc-title">${esc(a.title)}</h2>${desc ? `<p class="bc-desc">${esc(desc)}</p>` : ""}${m.reading_min ? `<span class="bc-meta">${m.reading_min} phút đọc</span>` : ""}</div></a>`;
}
function chipCard(slug, tier, tmap) {
  const title = tmap[slug] || slug;
  const pub = isPublished(slug);
  return pub
    ? `<a class="chip-card" href="${escAttr(slug)}.html"><span class="cc-tier">${esc(tier)}</span><div class="cc-title">${esc(title)}</div></a>`
    : `<div class="chip-card soon"><span class="cc-tier">${esc(tier)}</span><div class="cc-title">${esc(title)}</div><span class="cc-soon">Sắp có</span></div>`;
}

export function buildStructure() {
  const plan = loadPlan();
  const outDir = path.join(ROOT, "blog");
  fs.mkdirSync(outDir, { recursive: true });
  const tmap = titleMap(plan);
  const catName = (slug) => (plan.categories.find((c) => c.slug === slug) || {}).name || slug;
  const catCount = (slug) => slug === "lo-trinh"
    ? plan.roadmaps.reduce((n, g) => n + g.items.length, 0)
    : plan.articles.filter((a) => a.category === slug).length;

  // ---------- INDEX (theo chặng + sidebar + CTA) ----------
  const catNav = `<nav class="cat-nav"><a href="lo-trinh.html">Lộ trình</a><a href="moi-quan-tam.html">Theo mối quan tâm</a>${plan.categories.filter((c) => c.slug !== "lo-trinh").map((c) => `<a href="danh-muc-${c.slug}.html">${esc(c.name)}</a>`).join("")}<a href="cam-nhan-cong-dong.html">Cảm nhận cộng đồng</a></nav>`;
  const chapters = (plan.chapters || []).map((ch) =>
    `<section class="chapter"><div class="ch-head"><h2>${esc(ch.title)}</h2>${ch.desc ? `<p>${esc(ch.desc)}</p>` : ""}</div><div class="chip-grid">${ch.items.map((it) => chipCard(it.slug, it.tier, tmap)).join("")}</div></section>`
  ).join("");
  const sidebar = `<aside class="blog-side">
      <div class="side-box side-cats"><div class="side-title">Danh mục</div><ul>${plan.categories.map((c) => `<li><a href="${c.slug === "lo-trinh" ? "lo-trinh.html" : `danh-muc-${c.slug}.html`}">${esc(c.name)}</a><span>${catCount(c.slug)}</span></li>`).join("")}</ul></div>
      <div class="side-box side-app"><div class="side-tag">App IKI</div><div class="side-h">AI Coach Đông y cá nhân hoá</div><p>Nhật ký 30 giây mỗi ngày, gợi ý theo thể tạng của riêng bạn.</p><a class="btn btn-primary" href="../app.html">Tải miễn phí →</a></div>
    </aside>`;
  // Khối "Chăm sóc theo độ tuổi" (nổi bật) — từ nhóm roadmap "Theo độ tuổi"
  const AGE = {
    "lo-trinh-cham-soc-suc-khoe-nguoi-moi-bat-dau": { label: "Bắt đầu", short: "Người mới bắt đầu" },
    "lo-trinh-nguoi-tre": { label: "20–35 tuổi", short: "Người trẻ" },
    "lo-trinh-nguoi-trung-nien": { label: "35–55 tuổi", short: "Người trung niên" },
    "lo-trinh-nguoi-cao-tuoi": { label: "55+ tuổi", short: "Người cao tuổi" },
  };
  const ageGroup = plan.roadmaps.find((g) => /độ tuổi/i.test(g.group));
  const ageSection = ageGroup ? `<section class="age-section"><div class="age-head"><h2>Chăm sóc sức khoẻ theo độ tuổi</h2><p>Chọn lộ trình phù hợp với giai đoạn của bạn — từ người mới, người trẻ đến người cao tuổi.</p></div><div class="age-grid">${ageGroup.items.map((it) => {
    const pub = isPublished(it.slug); const a = AGE[it.slug] || { label: "", short: it.title };
    return `<a class="age-card${pub ? "" : " soon"}" href="${pub ? escAttr(it.slug) + ".html" : "lo-trinh.html"}"><span class="age-label">${esc(a.label)}</span><span class="age-title">${esc(a.short)}</span>${pub ? "" : '<span class="age-soon">Sắp có</span>'}</a>`;
  }).join("")}</div></section>` : "";
  // Search theo chủ đề (client-side, đọc search-index.json)
  const searchBox = `<div class="blog-search"><input type="search" id="blogSearch" placeholder="Tìm chủ đề bạn muốn đọc…" autocomplete="off" aria-label="Tìm bài viết" /><div id="blogSearchResults" class="search-results" hidden></div></div>`;
  const searchScript = `<script>(function(){var i=document.getElementById('blogSearch'),b=document.getElementById('blogSearchResults'),x=null;function n(s){return (s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();}function L(){return x?Promise.resolve(x):fetch('search-index.json').then(function(r){return r.json();}).then(function(d){x=d;return d;});}function R(q){var q2=n(q);if(!q2){b.hidden=true;b.innerHTML='';return;}L().then(function(d){var h=d.filter(function(a){return n(a.title+' '+a.desc+' '+a.cat).indexOf(q2)>-1;}).slice(0,8);b.innerHTML=h.length?h.map(function(a){return a.url?('<a href="'+a.url+'"><span class="sr-cat">'+a.cat+'</span>'+a.title+'</a>'):('<span class="sr-soon"><span class="sr-cat">'+a.cat+'</span>'+a.title+' — sắp có</span>');}).join(''):'<div class="sr-empty">Không tìm thấy chủ đề. Thử từ khoá khác.</div>';b.hidden=false;});}if(i){i.addEventListener('input',function(){R(i.value);});i.addEventListener('focus',function(){if(i.value)R(i.value);});document.addEventListener('click',function(e){if(!e.target.closest('.blog-search'))b.hidden=true;});}})();</script>`;
  const searchIndex = [];
  for (const a of plan.articles) { const m = isPublished(a.slug) ? (draftMeta(a.slug) || {}) : {}; searchIndex.push({ title: a.title, url: isPublished(a.slug) ? `${a.slug}.html` : null, cat: catName(a.category), desc: m.description || "" }); }
  for (const g of plan.roadmaps) for (const it of g.items) if (!plan.articles.find((a) => a.slug === it.slug)) searchIndex.push({ title: it.title, url: isPublished(it.slug) ? `${it.slug}.html` : null, cat: "Lộ trình", desc: g.group });
  fs.writeFileSync(path.join(outDir, "search-index.json"), JSON.stringify(searchIndex), "utf8");
  fs.writeFileSync(path.join(outDir, "index.html"),
    head("Blog IKI — Lộ trình chăm sóc sức khoẻ chủ động",
      "Blog IKI — lộ trình chăm sóc sức khoẻ chủ động theo từng chặng: hiểu cơ thể, nền tảng ăn uống, thói quen, tri thức Đông y và kiến thức thực phẩm. Cá nhân hoá theo thể tạng.",
      `${SITE}/blog/`,
      { "@context": "https://schema.org", "@type": "Blog", name: "Blog IKI", url: `${SITE}/blog/`, description: "Lộ trình chăm sóc sức khoẻ chủ động theo thể tạng.", inLanguage: "vi-VN", publisher: { "@type": "Organization", name: "IKI by HOPE CORP" } })
    + header()
    + `<main><section class="blog-hero"><span class="eyebrow">Blog IKI · Lộ trình chăm sóc sức khoẻ</span><h1>Chăm sóc sức khoẻ chủ động, theo từng chặng</h1><p>Đi từ hiểu cơ thể mình đến xây thói quen bền vững — mỗi chặng một bước, phủ dần kiến thức để bạn tự chủ sức khoẻ mỗi ngày.</p></section>${searchBox}${ageSection}${catNav}<div class="blog-layout"><div class="blog-main">${chapters}</div>${sidebar}</div>${emailCta(plan, "index")}${searchScript}</main>`
    + footer(), "utf8");

  // ---------- CATEGORY HUBS ----------
  for (const c of plan.categories) {
    if (c.slug === "lo-trinh") continue;
    const pub = plan.articles.filter((a) => a.category === c.slug && isPublished(a.slug));
    const planned = plan.articles.filter((a) => a.category === c.slug && !isPublished(a.slug));
    const grid = pub.length ? `<section class="cat-section"><div class="blog-grid">${pub.map((a) => imgCard(a, c.name)).join("")}</div></section>` : "";
    const soon = planned.length ? `<section class="soon-list"><h2>Nội dung sắp có</h2><ul>${planned.map((a) => `<li><span class="tag">Sắp có</span>${esc(a.title)}</li>`).join("")}</ul></section>` : "";
    fs.writeFileSync(path.join(outDir, `danh-muc-${c.slug}.html`),
      head(`${c.name} | Blog IKI`, c.desc, `${SITE}/blog/danh-muc-${c.slug}.html`,
        { "@context": "https://schema.org", "@type": "CollectionPage", name: c.name, url: `${SITE}/blog/danh-muc-${c.slug}.html`, description: c.desc, inLanguage: "vi-VN" })
      + header()
      + `<main><section class="blog-hero"><span class="eyebrow">Trụ nội dung</span><h1>${esc(c.name)}</h1><p>${esc(c.desc)}</p></section>${grid}${soon}${emailCta(plan, `cat:${c.slug}`)}</main>`
      + footer(), "utf8");
  }

  // ---------- ROADMAP HUB ----------
  const groups = plan.roadmaps.map((g) => `<div class="rm-group"><h2>${esc(g.group)}</h2>${g.desc ? `<p class="d">${esc(g.desc)}</p>` : ""}<ul class="rm-list">${g.items.map((it) => {
    const pub = isPublished(it.slug);
    return `<li><span class="dot ${pub ? "pub" : "soon"}"></span>${pub ? `<a href="${escAttr(it.slug)}.html">${esc(it.title)}</a>` : `<span>${esc(it.title)}</span>`}<span class="st ${pub ? "pub" : "soon"}">${pub ? "Đã có" : "Sắp có"}</span></li>`;
  }).join("")}</ul></div>`).join("");
  fs.writeFileSync(path.join(outDir, "lo-trinh.html"),
    head("Lộ trình chăm sóc sức khoẻ chủ động | Blog IKI",
      "Các lộ trình chăm sóc sức khoẻ chủ động theo chặng — theo độ tuổi, nhu cầu và mối quan tâm sức khoẻ.",
      `${SITE}/blog/lo-trinh.html`,
      { "@context": "https://schema.org", "@type": "CollectionPage", name: "Lộ trình chăm sóc sức khoẻ chủ động", url: `${SITE}/blog/lo-trinh.html`, inLanguage: "vi-VN" })
    + header()
    + `<main><section class="blog-hero"><span class="eyebrow">Lộ trình theo chặng</span><h1>Lộ trình chăm sóc sức khoẻ chủ động</h1><p>Chọn lộ trình phù hợp với bạn — theo độ tuổi, nhu cầu sống và mối quan tâm. Mỗi lộ trình đi theo chặng, từ dễ đến sâu.</p></section>${groups}${emailCta(plan, "lo-trinh")}</main>`
    + footer(), "utf8");

  // ---------- HUB THEO MỐI QUAN TÂM ----------
  const concerns = Array.isArray(plan.concerns) ? plan.concerns : [];
  const catOf = (slug) => { const a = plan.articles.find((x) => x.slug === slug); return a ? catName(a.category) : ""; };
  const concernSections = concerns.map((g) => {
    const cards = (g.items || []).filter((s) => isPublished(s)).map((s) => imgCard({ slug: s, title: (tmap[s] || s) }, catOf(s))).join("");
    if (!cards) return "";
    return `<section class="cat-section"><div class="ch-head" style="text-align:center;margin-bottom:14px"><h2>${esc(g.name)}</h2>${g.desc ? `<p>${esc(g.desc)}</p>` : ""}</div><div class="blog-grid">${cards}</div></section>`;
  }).join("");
  fs.writeFileSync(path.join(outDir, "moi-quan-tam.html"),
    head("Chăm sóc theo mối quan tâm | Blog IKI",
      "Chọn theo điều bạn quan tâm — tiêu hoá nhẹ nhàng, ngủ ngon, năng lượng mỗi ngày, ăn uống cân bằng — và tìm bài viết chăm sóc sức khoẻ chủ động phù hợp.",
      `${SITE}/blog/moi-quan-tam.html`,
      { "@context": "https://schema.org", "@type": "CollectionPage", name: "Chăm sóc sức khoẻ theo mối quan tâm", url: `${SITE}/blog/moi-quan-tam.html`, inLanguage: "vi-VN" })
    + header()
    + `<main><section class="blog-hero"><span class="eyebrow">Theo mối quan tâm</span><h1>Chăm sóc theo điều bạn đang quan tâm</h1><p>Bạn đang để ý tới tiêu hoá, giấc ngủ, năng lượng hay bữa ăn cân bằng? Chọn nhóm quan tâm của mình để đọc những bài phù hợp nhất — đây là chia sẻ kiến thức chăm sóc sức khoẻ chủ động, không nhằm chẩn đoán hay thay thế tư vấn y khoa.</p></section>${catNav}${concernSections}${emailCta(plan, "moi-quan-tam")}</main>`
    + footer(), "utf8");

  // ---------- CẢM NHẬN CỘNG ĐỒNG (testimonials — bản đã lọc, hợp luật TPBS) ----------
  const tms = Array.isArray(plan.testimonials) ? plan.testimonials : [];
  const tmCards = tms.map((t) => `<figure class="tm-card"><blockquote>${esc(t.text)}</blockquote><figcaption><span class="tm-name">${esc(t.name)}</span>${t.place ? `<span class="tm-place">${esc(t.place)}</span>` : ""}</figcaption></figure>`).join("");
  const tmStyle = `<style>.tm-wrap{max-width:1100px;margin:0 auto;padding:8px 20px 10px}.tm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}.tm-card{background:#fff;border:1px solid #eef0f3;border-radius:16px;padding:22px 22px 18px;box-shadow:0 1px 2px rgba(16,24,40,.04),0 2px 10px rgba(16,24,40,.05);display:flex;flex-direction:column;gap:14px}.tm-card blockquote{margin:0;color:#344054;font-size:1.02rem;line-height:1.65}.tm-card blockquote::before{content:"\\201C";color:var(--iki-teal,#4BC0AB);font-family:var(--font-display,'Cormorant Garamond');font-size:2rem;line-height:0;vertical-align:-.35em;margin-right:2px}.tm-card figcaption{display:flex;flex-direction:column}.tm-name{font-weight:700;color:#101828}.tm-place{color:#98a2b3;font-size:.86rem}.tm-note{max-width:1100px;margin:6px auto 0;padding:0 20px;color:#98a2b3;font-size:.86rem;text-align:center}</style>`;
  fs.writeFileSync(path.join(outDir, "cam-nhan-cong-dong.html"),
    head("Cảm nhận cộng đồng | Blog IKI",
      "Những chia sẻ chân thật của cộng đồng IKI về hành trình xây thói quen chăm sóc sức khoẻ chủ động mỗi ngày.",
      `${SITE}/blog/cam-nhan-cong-dong.html`,
      { "@context": "https://schema.org", "@type": "CollectionPage", name: "Cảm nhận cộng đồng IKI", url: `${SITE}/blog/cam-nhan-cong-dong.html`, inLanguage: "vi-VN" })
    + header()
    + tmStyle
    + `<main><section class="blog-hero"><span class="eyebrow">Cảm nhận cộng đồng</span><h1>Những thói quen nhỏ, kể bằng lời thật</h1><p>Đây là chia sẻ của các thành viên trong cộng đồng IKI về hành trình xây thói quen chăm sóc sức khoẻ chủ động. Mỗi người một cảm nhận riêng.</p></section><div class="tm-wrap"><div class="tm-grid">${tmCards}</div></div><p class="tm-note">Các chia sẻ trên là trải nghiệm cá nhân về thay đổi thói quen sinh hoạt, không phải lời khuyên y khoa và không phải cam kết về sức khoẻ. Kết quả có thể khác nhau tuỳ cơ địa và mức độ kiên trì của mỗi người. Sản phẩm là thực phẩm bổ sung, không phải thuốc và không thay thế thuốc chữa bệnh.</p>${emailCta(plan, "cam-nhan-cong-dong")}</main>`
    + footer(), "utf8");

  // ---------- MIỄN TRỪ TRÁCH NHIỆM (điều khoản nội dung) ----------
  const legalStyle = `<style>.legal{max-width:760px;margin:0 auto;padding:8px 22px 10px;font-size:1.02rem;color:#344054}.legal h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.4rem;color:#101828;margin:1.7em 0 .4em;scroll-margin-top:90px}.legal h2 .ln{color:var(--iki-teal-deep,#2E8975);font-family:var(--font-sans,'Manrope');font-size:.9rem;font-weight:700;margin-right:8px}.legal p{margin:.7em 0;line-height:1.72}.legal ul{margin:.5em 0;padding-left:1.3em}.legal li{margin:.35em 0;line-height:1.6}.legal strong{color:#101828}.legal .upd{color:#98a2b3;font-size:.88rem}.legal .note{background:#f4f8ff;border:1px solid #d6e4fb;border-radius:12px;padding:14px 18px;color:#334155;font-size:.94rem;margin:16px 0}</style>`;
  const legalBody = `<section class="legal">
    <p class="upd">Cập nhật: 2026 · Áp dụng cho blog và các kênh nội dung của IKI by HOPE CORP.</p>
    <div class="note">Văn bản này là điều khoản nội dung &amp; miễn trừ trách nhiệm cho mục đích tham khảo và minh bạch với người đọc. Doanh nghiệp nên để bộ phận pháp chế rà soát trước khi coi là văn bản pháp lý chính thức.</div>
    <h2><span class="ln">1.</span>Mục đích và phạm vi nội dung</h2>
    <p>Toàn bộ nội dung trên blog và các kênh chính thức của IKI (bài viết, hình ảnh, video, bản tin, cẩm nang…) hướng tới mục tiêu <strong>chia sẻ kiến thức chăm sóc sức khoẻ chủ động</strong>: dinh dưỡng, thói quen, vận động, giấc ngủ, tinh thần và kinh nghiệm dân gian được tiếp nhận có chọn lọc. Nội dung mang tính phổ thông, giáo dục cộng đồng, giúp người đọc <strong>hiểu đúng – làm đúng – duy trì lâu dài</strong>.</p>
    <p>IKI là thương hiệu thuộc Công ty Cổ phần TMDV HOPE, <strong>không phải cơ sở khám chữa bệnh</strong>. Nội dung không phải là dịch vụ y tế và không thay thế việc thăm khám, chẩn đoán hay tư vấn trực tiếp của bác sĩ có thẩm quyền.</p>
    <h2><span class="ln">2.</span>Không thay thế tư vấn y khoa cá nhân</h2>
    <p>Mỗi cơ thể là một trường hợp riêng. Điều phù hợp với người này chưa chắc phù hợp với người khác. Nếu bạn đang có bệnh lý nền, đang dùng thuốc theo đơn, đang mang thai hoặc cho con bú, hãy <strong>trao đổi với bác sĩ của bạn trước khi áp dụng</strong> bất kỳ gợi ý nào từ nội dung của chúng tôi. Việc lắng nghe cơ thể và điều chỉnh cùng chuyên gia là nền tảng của chăm sóc sức khoẻ chủ động.</p>
    <h2><span class="ln">3.</span>Về sản phẩm của IKI / HOPE</h2>
    <p>Các sản phẩm của IKI (đạm thực vật, trà thảo mộc và các sản phẩm khác) là <strong>thực phẩm bổ sung, không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh</strong>. Sản phẩm được công bố theo quy định hiện hành. Cảm nhận và kết quả có thể khác nhau tuỳ cơ địa, chế độ sinh hoạt và mức độ kiên trì của mỗi người.</p>
    <h2><span class="ln">4.</span>Về cảm nhận và trải nghiệm cộng đồng</h2>
    <p>Các chia sẻ, cảm nhận của thành viên cộng đồng là <strong>trải nghiệm cá nhân về thay đổi thói quen sinh hoạt</strong>, không phải lời khuyên y khoa, không đại diện cho tất cả mọi người và không phải cam kết về kết quả sức khoẻ.</p>
    <h2><span class="ln">5.</span>Miễn trừ trách nhiệm</h2>
    <p>IKI / HOPE CORP và đội ngũ vận hành <strong>không chịu trách nhiệm pháp lý hoặc cá nhân</strong> đối với bất kỳ rủi ro, hệ quả hoặc tác động không mong muốn nào có thể phát sinh khi người đọc <strong>tự ý áp dụng thông tin mà không có hướng dẫn y tế phù hợp</strong>. Mọi nội dung chỉ mang tính tham khảo, giáo dục và khuyến khích thay đổi lối sống tích cực, không nhằm chẩn đoán, điều trị hay thay thế tư vấn y khoa cá nhân.</p>
    <h2><span class="ln">6.</span>Bản quyền và sử dụng lại nội dung</h2>
    <p>Nội dung, hình ảnh và tài liệu trên các kênh của IKI thuộc bản quyền của Công ty Cổ phần TMDV HOPE. Việc trích dẫn hoặc sử dụng lại cần ghi rõ nguồn và không chỉnh sửa làm sai lệch nội dung gốc. Chúng tôi khuyến khích chia sẻ có trách nhiệm vì mục tiêu lan toả tri thức sức khoẻ, và không chịu trách nhiệm với việc diễn giải sai lệch nằm ngoài phạm vi kiểm soát của mình.</p>
    <h2><span class="ln">7.</span>Đồng ý và luật áp dụng</h2>
    <p>Việc truy cập, tham khảo, sử dụng hoặc tham gia các hoạt động do IKI / HOPE vận hành đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý với các điều khoản trong văn bản này. Văn bản được biên soạn theo pháp luật Việt Nam hiện hành; mọi tranh chấp, khiếu nại sẽ được xem xét, giải quyết theo quy định của pháp luật Việt Nam.</p>
    <p class="upd">Liên hệ: contact@ikihealing.com · 0987.931.551 — Công ty Cổ phần TMDV HOPE (MST 0801404967).</p>
  </section>`;
  fs.writeFileSync(path.join(outDir, "mien-tru-trach-nhiem.html"),
    head("Miễn trừ trách nhiệm &amp; điều khoản nội dung | IKI",
      "Điều khoản nội dung và miễn trừ trách nhiệm của IKI by HOPE CORP: nội dung mang tính giáo dục, không thay thế tư vấn y khoa; sản phẩm là thực phẩm bổ sung.",
      `${SITE}/blog/mien-tru-trach-nhiem.html`, null, true)
    + header() + legalStyle
    + `<main><section class="blog-hero" style="padding-bottom:6px"><span class="eyebrow">Điều khoản nội dung</span><h1>Miễn trừ trách nhiệm</h1><p>Cách chúng tôi chia sẻ nội dung sức khoẻ và ranh giới trách nhiệm, để bạn đọc an tâm và đúng cách.</p></section>${legalBody}</main>`
    + footer(), "utf8");

  // ---------- THANK YOU ----------
  fs.writeFileSync(path.join(outDir, "cam-on.html"),
    head("Cảm ơn bạn đã đăng ký | Blog IKI", "Cảm ơn bạn đã để lại email nhận cẩm nang chăm sóc sức khoẻ chủ động từ IKI.", `${SITE}/blog/cam-on.html`, null, true)
    + header()
    + `<main><section class="blog-hero" style="padding-bottom:40px"><span class="eyebrow">Đã nhận đăng ký</span><h1>Cảm ơn bạn!</h1><p>IKI đã nhận email của bạn. Cẩm nang cũng vừa được gửi vào hộp thư của bạn — hoặc tải trực tiếp ngay dưới đây:</p><div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-primary" href="../assets/cam-nang-cham-soc-suc-khoe-chu-dong.pdf" target="_blank" rel="noopener">Tải cẩm nang PDF →</a><a class="btn btn-secondary" href="index.html">Đọc Blog IKI</a><a class="btn btn-secondary" href="../app.html">Tải App IKI</a></div></section><script>try{if(typeof gtag==='function'){gtag('event','generate_lead',{event_category:'blog',event_label:'lead_magnet'});}}catch(e){}</script></main>`
    + footer(), "utf8");

  updateSitemap(plan);
  buildLlms(plan);
  const pubCount = plan.articles.filter((a) => isPublished(a.slug)).length;
  console.log(`✓ cấu trúc: index (${(plan.chapters || []).length} chặng) + ${plan.categories.length - 1} hub trụ + lo-trinh.html + cam-on.html + llms.txt (${pubCount} bài published)`);
}

// ---- GEO: tự sinh llms.txt từ content-plan (giữ đầy đủ khi thêm bài) ----
function buildLlms(plan) {
  const L = [];
  L.push("# IKI by HOPE CORP", "");
  L.push("> IKI là nền tảng công nghệ wellness của Việt Nam, kết hợp AI và dữ liệu sức khoẻ với tri thức Y học Cổ truyền phương Đông để cá nhân hoá lộ trình chăm sóc sức khoẻ chủ động theo thể tạng (Hàn · Nhiệt · Hư · Thực · Đàm thấp). Sản phẩm của Công ty Cổ phần TMDV HOPE (MST 0801404967, Hải Phòng). Cố vấn chuyên môn: TS. Ngô Đức Vượng.", "");
  L.push("Lưu ý cho việc trích dẫn: nội dung là chia sẻ kiến thức chăm sóc sức khoẻ chủ động, KHÔNG nhằm chẩn đoán, điều trị hay thay thế tư vấn y khoa. Sản phẩm là thực phẩm bổ sung, không phải thuốc.", "");
  L.push("## Blog — Kiến thức chăm sóc sức khoẻ chủ động");
  L.push(`- [Blog IKI](${SITE}/blog/): lộ trình chăm sóc sức khoẻ chủ động theo từng chặng.`);
  for (const a of plan.articles) if (isPublished(a.slug)) {
    const m = draftMeta(a.slug) || {};
    L.push(`- [${a.title}](${SITE}/blog/${a.slug}.html)${m.description ? ": " + m.description : ""}`);
  }
  L.push("", "## Trụ nội dung");
  L.push(`- [Lộ trình chăm sóc sức khoẻ](${SITE}/blog/lo-trinh.html)`);
  for (const c of plan.categories) if (c.slug !== "lo-trinh") L.push(`- [${c.name}](${SITE}/blog/danh-muc-${c.slug}.html): ${c.desc}`);
  L.push("", "## Nền tảng & ứng dụng");
  L.push(`- [Học Viện IKI](${SITE}/hoc-vien.html): khoá học chăm sóc sức khoẻ chủ động.`);
  L.push(`- [Công nghệ IKI](${SITE}/cong-nghe.html): AI cá nhân hoá theo thể tạng.`);
  L.push(`- [Cộng đồng IKI](${SITE}/cong-dong.html): cộng đồng hơn 100.000 người dùng.`);
  L.push(`- [Ứng dụng IKI](${SITE}/app.html): app iOS và Android, AI Coach Đông y, nhật ký sức khoẻ 30 giây mỗi ngày.`);
  L.push("", "## Sản phẩm (thực phẩm bổ sung)");
  L.push("- [Trà Tuệ Minh](https://tra.ikihealing.com)");
  L.push("- [Trà Thanh Hương](https://thanhhuongtra.ikihealing.com)");
  L.push("- [Đạm thực vật True Vegan Protein](https://trueveganprotein.com)");
  L.push("- [Cửa hàng IKI](https://www.ikihealingdetox.com)");
  L.push("", "## Liên hệ");
  L.push("- Email: contact@ikihealing.com");
  L.push("- Điện thoại: 0987.931.551");
  L.push("- Địa chỉ: 63/253 Ngô Quyền, P. Lê Thanh Nghị, TP Hải Phòng", "");
  fs.writeFileSync(path.join(ROOT, "llms.txt"), L.join("\n"), "utf8");
}

function updateSitemap(plan) {
  const sp = path.join(ROOT, "sitemap.xml");
  if (!fs.existsSync(sp)) return;
  let xml = fs.readFileSync(sp, "utf8");
  const today = "2026-07-21";
  const url = (loc, pri, freq) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
  const urls = [url(`${SITE}/blog/`, "0.9", "daily"), url(`${SITE}/blog/lo-trinh.html`, "0.8", "weekly"), url(`${SITE}/blog/moi-quan-tam.html`, "0.8", "weekly"), url(`${SITE}/blog/cam-nhan-cong-dong.html`, "0.6", "monthly"), url(`${SITE}/blog/mien-tru-trach-nhiem.html`, "0.3", "yearly")];
  for (const c of plan.categories) if (c.slug !== "lo-trinh") urls.push(url(`${SITE}/blog/danh-muc-${c.slug}.html`, "0.7", "weekly"));
  for (const a of plan.articles) if (isPublished(a.slug)) urls.push(url(`${SITE}/blog/${a.slug}.html`, "0.8", "monthly"));
  const block = `  <!-- BLOG:START (tự sinh bởi build-structure.mjs — đừng sửa tay) -->\n${urls.join("\n")}\n  <!-- BLOG:END -->`;
  if (/<!-- BLOG:START[\s\S]*?BLOG:END -->/.test(xml)) xml = xml.replace(/  <!-- BLOG:START[\s\S]*?BLOG:END -->/, block);
  else xml = xml.replace(/<\/urlset>/, `${block}\n\n</urlset>`);
  fs.writeFileSync(sp, xml, "utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) buildStructure();
