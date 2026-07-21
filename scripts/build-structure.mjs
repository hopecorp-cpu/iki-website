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
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests; base-uri 'self'; object-src 'none'; form-action 'self' https://formsubmit.co https://formspree.io https://hope-ops-hub.vercel.app;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${noindex ? '<meta name="robots" content="noindex,follow" />\n  ' : ""}<title>${esc(title)}</title>
  <meta name="description" content="${escAttr(desc)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="vi" href="${canonical}" />
  <link rel="alternate" hreflang="x-default" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="vi_VN" />
  <meta property="og:site_name" content="IKI by HOPE CORP" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escAttr(title)}" />
  <meta property="og:description" content="${escAttr(desc)}" />
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
    <div class="footer-bottom"><span>© 2026 Công ty Cổ phần TMDV HOPE — IKI là thương hiệu được sở hữu và vận hành bởi HOPE CORP.</span></div>
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
  const catNav = `<nav class="cat-nav"><a href="lo-trinh.html">Lộ trình</a>${plan.categories.filter((c) => c.slug !== "lo-trinh").map((c) => `<a href="danh-muc-${c.slug}.html">${esc(c.name)}</a>`).join("")}</nav>`;
  const chapters = (plan.chapters || []).map((ch) =>
    `<section class="chapter"><div class="ch-head"><h2>${esc(ch.title)}</h2>${ch.desc ? `<p>${esc(ch.desc)}</p>` : ""}</div><div class="chip-grid">${ch.items.map((it) => chipCard(it.slug, it.tier, tmap)).join("")}</div></section>`
  ).join("");
  const sidebar = `<aside class="blog-side">
      <div class="side-box side-cats"><div class="side-title">Danh mục</div><ul>${plan.categories.map((c) => `<li><a href="${c.slug === "lo-trinh" ? "lo-trinh.html" : `danh-muc-${c.slug}.html`}">${esc(c.name)}</a><span>${catCount(c.slug)}</span></li>`).join("")}</ul></div>
      <div class="side-box side-app"><div class="side-tag">App IKI</div><div class="side-h">AI Coach Đông y cá nhân hoá</div><p>Nhật ký 30 giây mỗi ngày, gợi ý theo thể tạng của riêng bạn.</p><a class="btn btn-primary" href="../app.html">Tải miễn phí →</a></div>
    </aside>`;
  fs.writeFileSync(path.join(outDir, "index.html"),
    head("Blog IKI — Lộ trình chăm sóc sức khoẻ chủ động",
      "Blog IKI — lộ trình chăm sóc sức khoẻ chủ động theo từng chặng: hiểu cơ thể, nền tảng ăn uống, thói quen, tri thức Đông y và kiến thức thực phẩm. Cá nhân hoá theo thể tạng.",
      `${SITE}/blog/`,
      { "@context": "https://schema.org", "@type": "Blog", name: "Blog IKI", url: `${SITE}/blog/`, description: "Lộ trình chăm sóc sức khoẻ chủ động theo thể tạng.", inLanguage: "vi-VN", publisher: { "@type": "Organization", name: "IKI by HOPE CORP" } })
    + header()
    + `<main><section class="blog-hero"><span class="eyebrow">Blog IKI · Lộ trình chăm sóc sức khoẻ</span><h1>Chăm sóc sức khoẻ chủ động, theo từng chặng</h1><p>Đi từ hiểu cơ thể mình đến xây thói quen bền vững — mỗi chặng một bước, phủ dần kiến thức để bạn tự chủ sức khoẻ mỗi ngày.</p></section>${catNav}<div class="blog-layout"><div class="blog-main">${chapters}</div>${sidebar}</div>${emailCta(plan, "index")}</main>`
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

  // ---------- THANK YOU ----------
  fs.writeFileSync(path.join(outDir, "cam-on.html"),
    head("Cảm ơn bạn đã đăng ký | Blog IKI", "Cảm ơn bạn đã để lại email nhận cẩm nang chăm sóc sức khoẻ chủ động từ IKI.", `${SITE}/blog/cam-on.html`, null, true)
    + header()
    + `<main><section class="blog-hero" style="padding-bottom:40px"><span class="eyebrow">Đã nhận đăng ký</span><h1>Cảm ơn bạn!</h1><p>IKI đã nhận email của bạn. Cẩm nang cũng vừa được gửi vào hộp thư của bạn — hoặc tải trực tiếp ngay dưới đây:</p><div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-primary" href="../assets/cam-nang-cham-soc-suc-khoe-chu-dong.pdf" target="_blank" rel="noopener">Tải cẩm nang PDF →</a><a class="btn btn-secondary" href="index.html">Đọc Blog IKI</a><a class="btn btn-secondary" href="../app.html">Tải App IKI</a></div></section></main>`
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
  const urls = [url(`${SITE}/blog/`, "0.9", "daily"), url(`${SITE}/blog/lo-trinh.html`, "0.8", "weekly")];
  for (const c of plan.categories) if (c.slug !== "lo-trinh") urls.push(url(`${SITE}/blog/danh-muc-${c.slug}.html`, "0.7", "weekly"));
  for (const a of plan.articles) if (isPublished(a.slug)) urls.push(url(`${SITE}/blog/${a.slug}.html`, "0.8", "monthly"));
  const block = `  <!-- BLOG:START (tự sinh bởi build-structure.mjs — đừng sửa tay) -->\n${urls.join("\n")}\n  <!-- BLOG:END -->`;
  if (/<!-- BLOG:START[\s\S]*?BLOG:END -->/.test(xml)) xml = xml.replace(/  <!-- BLOG:START[\s\S]*?BLOG:END -->/, block);
  else xml = xml.replace(/<\/urlset>/, `${block}\n\n</urlset>`);
  fs.writeFileSync(sp, xml, "utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) buildStructure();
