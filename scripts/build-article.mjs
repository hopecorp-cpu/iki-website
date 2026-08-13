#!/usr/bin/env node
/**
 * build-article.mjs — Dựng 1 bài blog tĩnh từ nguồn blog-drafts/<slug>.md
 * → blog/<slug>.html theo template IKI (head + schema Article/FAQ/Breadcrumb + header/footer).
 *
 * Nguồn: JSON frontmatter (giữa ---json ... ---) + body Markdown.
 * KHÔNG thư viện ngoài — MD converter tối giản đủ dùng (h2/h3, ul/ol, blockquote,
 *   :::case / :::note box, **bold** *italic* [link](url), đoạn văn).
 *
 * Chạy:  node scripts/build-article.mjs blog-drafts/<slug>.md
 *        node scripts/build-article.mjs --all        (dựng lại toàn bộ blog-drafts)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildStructure, emailCta } from "./build-structure.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://ikihealing.com";
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content-plan.json"), "utf8"));
// Beacon đo tương tác lead (đọc/click/tải) — gắn mã lead từ ?lid (link email). Không thu thập gì nếu không có lid.
const BEACON = `<script>(function(){var T='https://hope-ops-hub.vercel.app/api/track';function lid(){try{var u=new URLSearchParams(location.search).get('lid');if(u){sessionStorage.setItem('iki_lid',u);return u;}return sessionStorage.getItem('iki_lid')||'';}catch(e){return '';}}function b(e,m){var id=lid();if(!id)return;var i=new Image();i.src=T+'?lid='+encodeURIComponent(id)+'&e='+e+(m?'&m='+encodeURIComponent(m):'')+'&_='+Date.now();}var s=location.pathname.split('/').pop().replace(/\\.html$/,'')||'index';if(lid())b('read',s);document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a');if(!a)return;var h=a.getAttribute('href')||'';if(/\\.pdf($|\\?)/i.test(h))b('download',(h.split('/').pop()||'pdf').slice(0,60));else if(/ikihealingdetox|trueveganprotein|tra\\.ikihealing|thanhhuongtra|app\\.html/.test(h))b('click',h.slice(0,80));},true);})();</script>`;

// Popup thoát-trang thu email (exit-intent) → /api/blog-lead → chuỗi nuôi 30 ngày. Hiện 1 lần/khách; ẩn nếu đã đăng ký.
const EXIT_POPUP = `<div id="ikiExit" role="dialog" aria-modal="true" aria-label="Nhận cẩm nang chăm sóc sức khoẻ miễn phí" hidden>
  <div class="ie-card">
    <button class="ie-x" type="button" aria-label="Đóng">&times;</button>
    <svg class="ie-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13M5 12v9h14v-9"></path><path d="M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"></path></svg>
    <span class="ie-tag">Cẩm nang miễn phí</span>
    <h3>Khoan đã — nhận cẩm nang<br>trước khi rời trang</h3>
    <p>Cẩm nang <strong>Chăm sóc sức khoẻ chủ động</strong>: lộ trình 6 chặng theo thể tạng. Gửi ngay vào email của bạn, không cần mua gì.</p>
    <form class="ie-form" novalidate>
      <input type="email" class="ie-email" placeholder="Email của bạn..." aria-label="Email" required autocomplete="email" />
      <input type="text" class="ie-honey" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <button type="submit" class="ie-btn">Gửi cẩm nang cho tôi &rarr;</button>
    </form>
    <p class="ie-ok" role="status" hidden>&#10003; Đã gửi! Kiểm tra email trong 1&ndash;3 phút (nhớ xem cả mục Quảng cáo / Spam).</p>
    <p class="ie-err" role="alert" hidden>Gửi chưa được &mdash; thử lại giúp mình nhé.</p>
    <button class="ie-no" type="button">Không, cảm ơn</button>
    <p class="ie-note">Không spam &middot; Huỷ nhận bất cứ lúc nào. Bằng việc để lại email, bạn đồng ý nhận nội dung chăm sóc sức khoẻ từ IKI.</p>
  </div>
</div>
<style>
#ikiExit[hidden]{display:none!important}
#ikiExit{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(18,38,31,.55);opacity:0;transition:opacity .25s ease}
#ikiExit.ie-show{opacity:1}
#ikiExit .ie-card{position:relative;background:#fff;width:100%;max-width:430px;border-radius:22px;padding:34px 26px 22px;text-align:center;box-shadow:0 24px 70px rgba(16,24,40,.28);transform:translateY(14px) scale(.98);transition:transform .28s cubic-bezier(.2,.8,.25,1);font-family:var(--font-sans,'Manrope',system-ui,sans-serif)}
#ikiExit.ie-show .ie-card{transform:none}
#ikiExit .ie-card::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;border-radius:22px 22px 0 0;background:linear-gradient(90deg,#A8D254,#4BC0AB)}
#ikiExit .ie-x{position:absolute;top:12px;right:14px;border:none;background:none;font-size:26px;line-height:1;color:#98a2b3;cursor:pointer}
#ikiExit .ie-x:hover{color:#475467}
#ikiExit .ie-ico{width:38px;height:38px;color:#2E8975;margin:2px auto 8px;display:block}
#ikiExit .ie-tag{display:inline-block;font-weight:700;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#2E8975}
#ikiExit h3{font-family:var(--font-display,'Cormorant Garamond',serif);font-weight:700;font-size:1.7rem;line-height:1.12;margin:8px 0 8px;color:#12261f}
#ikiExit p{color:#667085;font-size:1rem;margin:0 auto 16px;max-width:340px;line-height:1.5}
#ikiExit p strong{color:#2E8975}
#ikiExit .ie-form{display:flex;flex-direction:column;gap:10px;max-width:340px;margin:0 auto}
#ikiExit .ie-email{border:1px solid #d0d5dd;border-radius:12px;padding:14px 16px;font-size:1rem;font-family:inherit;outline:none}
#ikiExit .ie-email:focus{border-color:#4BC0AB;box-shadow:0 0 0 3px rgba(75,192,171,.16)}
#ikiExit .ie-honey{display:none}
#ikiExit .ie-btn{border:none;border-radius:12px;padding:14px;font-size:1rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#2E8975,#4BC0AB);cursor:pointer;font-family:inherit}
#ikiExit .ie-btn:disabled{opacity:.6;cursor:default}
#ikiExit .ie-ok{color:#2E8975;font-weight:600;margin:6px auto 0}
#ikiExit .ie-err{color:#d92d20;font-weight:600;margin:6px auto 0}
#ikiExit .ie-no{border:none;background:none;color:#98a2b3;font-size:.9rem;text-decoration:underline;cursor:pointer;margin-top:12px;font-family:inherit}
#ikiExit .ie-note{color:#98a2b3;font-size:.74rem;margin:12px auto 0;max-width:340px;line-height:1.4}
@media (prefers-reduced-motion: reduce){#ikiExit,#ikiExit .ie-card{transition:none}}
</style>
<script>
(function(){
  try{ if(localStorage.getItem('iki_exit_v1')||localStorage.getItem('iki_lead_ok')) return; }catch(e){}
  var ENDPOINT='https://hope-ops-hub.vercel.app/api/blog-lead';
  var el=document.getElementById('ikiExit'); if(!el) return;
  var shown=false, done=false;
  function open(){ if(shown) return; shown=true; try{localStorage.setItem('iki_exit_v1','1');}catch(e){}
    el.hidden=false; requestAnimationFrame(function(){el.classList.add('ie-show');});
    var i=el.querySelector('.ie-email'); if(i) setTimeout(function(){try{i.focus();}catch(e){}},60); }
  function close(){ el.classList.remove('ie-show'); setTimeout(function(){el.hidden=true;},260); }
  el.querySelector('.ie-x').addEventListener('click',close);
  el.querySelector('.ie-no').addEventListener('click',close);
  el.addEventListener('click',function(e){ if(e.target===el) close(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!el.hidden) close(); });
  document.addEventListener('mouseout',function(e){ if(!e.relatedTarget && e.clientY<=0) open(); });
  var deep=false, timeUp=false;
  setTimeout(function(){ timeUp=true; if(deep) open(); }, 25000);
  window.addEventListener('scroll',function(){ var h=document.documentElement;
    var sc=h.scrollTop/((h.scrollHeight-h.clientHeight)||1); if(sc>0.5){ deep=true; if(timeUp) open(); } },{passive:true});
  el.querySelector('.ie-form').addEventListener('submit',function(ev){ ev.preventDefault(); if(done) return;
    var email=(el.querySelector('.ie-email').value||'').trim();
    var honey=(el.querySelector('.ie-honey').value||'').trim();
    var btn=el.querySelector('.ie-btn'), ok=el.querySelector('.ie-ok'), err=el.querySelector('.ie-err'); err.hidden=true;
    if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ err.textContent='Email chưa đúng — kiểm tra lại giúp mình.'; err.hidden=false; return; }
    btn.disabled=true; btn.textContent='Đang gửi…';
    var src='exit:'+((location.pathname.split('/').pop()||'blog').replace(/\\.html$/,''));
    fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,source:src,consent:true,_honey:honey,phone:''})})
      .then(function(r){ return r.ok?r.json().catch(function(){return {ok:true};}):Promise.reject(r.status); })
      .then(function(j){ if(j&&j.ok===false) throw 0;
        done=true; try{localStorage.setItem('iki_lead_ok','1');}catch(e){}
        el.querySelector('.ie-form').hidden=true; el.querySelector('.ie-note').hidden=true; ok.hidden=false; setTimeout(close,3400); })
      .catch(function(){ btn.disabled=false; btn.textContent='Gửi cẩm nang cho tôi →'; err.textContent='Gửi chưa được — thử lại giúp mình nhé.'; err.hidden=false; });
  });
})();
</script>`;

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
// Cắt chuỗi theo biên từ (SEO: title ≤60, meta description ≤160 — tránh Google cắt cụt)
const clamp = (s, n) => { s = String(s || ""); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };
function slugifyHeading(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 50);
}

// --- inline markdown → html (text đã escape trước) ---
function inline(t) {
  let s = esc(t);
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (m, txt, url) => `<a href="${escAttr(url)}">${txt}</a>`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => `<a href="${escAttr(url)}">${txt}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  return s;
}

// --- block markdown → html + thu thập h2 cho TOC ---
function mdToHtml(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const out = [];
  const toc = [];
  let i = 0;
  const flushPara = (buf) => { if (buf.length) out.push(`<p>${inline(buf.join(" ").trim())}</p>`); };
  while (i < lines.length) {
    let ln = lines[i];
    // fenced box :::case / :::note
    const box = ln.match(/^:::(case|note)\s*(.*)$/);
    if (box) {
      const kind = box[1], titleRaw = box[2].trim();
      const inner = [];
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) { inner.push(lines[i]); i++; }
      i++; // skip closing :::
      const label = kind === "case" ? "Câu chuyện thực tế" : "Ghi chú";
      const title = titleRaw ? `<div class="ib-title">${inline(titleRaw)}</div>` : `<div class="ib-title">${label}</div>`;
      out.push(`<aside class="info-box ib-${kind}">${title}${mdToHtml(inner.join("\n")).html}</aside>`);
      continue;
    }
    // ảnh đứng riêng 1 dòng: ![alt](src) → figure có caption
    const img = ln.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      out.push(`<figure class="post-fig"><img loading="lazy" src="${escAttr(img[2])}" alt="${escAttr(img[1])}" />${img[1] ? `<figcaption>${esc(img[1])}</figcaption>` : ""}</figure>`);
      i++; continue;
    }
    if (/^###\s+/.test(ln)) { out.push(`<h3>${inline(ln.replace(/^###\s+/, ""))}</h3>`); i++; continue; }
    if (/^##\s+/.test(ln)) {
      const txt = ln.replace(/^##\s+/, "").trim();
      const id = slugifyHeading(txt);
      toc.push({ id, txt });
      out.push(`<h2 id="${id}">${inline(txt)}</h2>`);
      i++; continue;
    }
    if (/^>\s?/.test(ln)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(ln)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { buf.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`); i++; }
      out.push(`<ul>${buf.join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(ln)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`); i++; }
      out.push(`<ol>${buf.join("")}</ol>`);
      continue;
    }
    if (/^\s*$/.test(ln)) { i++; continue; }
    // paragraph
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{2,3}\s|>\s?|\s*[-*]\s|\s*\d+\.\s|:::)/.test(lines[i])) { buf.push(lines[i]); i++; }
    flushPara(buf);
  }
  return { html: out.join("\n"), toc };
}

function parseSource(raw) {
  const m = raw.match(/^---json\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) throw new Error("Thiếu block ---json ... --- ở đầu file.");
  let fm;
  try { fm = JSON.parse(m[1]); } catch (e) { throw new Error("JSON frontmatter lỗi: " + e.message); }
  return { fm, body: m[2] };
}

function render(fm, body) {
  const { html: article, toc } = mdToHtml(body);
  const url = `${SITE}/blog/${fm.slug}.html`;
  const faq = Array.isArray(fm.faq) ? fm.faq : [];
  const related = Array.isArray(fm.related) ? fm.related : [];
  const journey = Array.isArray(fm.journey) ? fm.journey : [];
  const author = fm.author || "Đội ngũ Health Coach IKI";
  const readMin = fm.reading_min || Math.max(5, Math.round((body.split(/\s+/).length) / 200));
  // Ảnh hero: ưu tiên hero_local (đã đóng logo IKI+HOPE), else hero_image (URL remote)
  const heroSrc = fm.hero_local ? `../${fm.hero_local}` : fm.hero_image || "";
  const heroAbs = fm.hero_local ? `${SITE}/${fm.hero_local}` : (fm.hero_image || `${SITE}/assets/banners/iki-banner-1200x630-og.jpg`);

  const ld = [
    {
      "@context": "https://schema.org", "@type": "Organization",
      name: "IKI Healing — by HOPE CORP", alternateName: ["IKI", "ikihealing", "IKI Healing"],
      url: SITE, logo: `${SITE}/iki-logo-1024.jpg`,
      parentOrganization: { "@type": "Organization", name: "Công ty Cổ phần TMDV HOPE", taxID: "0801404967" },
      sameAs: [
        "https://www.facebook.com/ikihealing/",
        "https://www.facebook.com/thanhtamguru/",
        "https://ikihealing.com/shop",
        "https://tra.ikihealing.com",
        "https://thanhhuongtra.ikihealing.com",
        "https://trueveganprotein.com",
        "https://apps.apple.com/vn/app/iki-eastern-wisdom-ai/id6767866520",
      ],
    },
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: fm.title, description: fm.description,
      image: [heroAbs],
      datePublished: fm.date, dateModified: fm.updated || fm.date,
      author: { "@type": "Organization", name: author, url: SITE },
      publisher: { "@type": "Organization", name: "IKI Healing — by HOPE CORP", logo: { "@type": "ImageObject", url: `${SITE}/iki-logo-1024.jpg` } },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      inLanguage: "vi-VN",
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog/` },
        { "@type": "ListItem", position: 3, name: fm.title, item: url },
      ],
    },
  ];
  if (faq.length) ld.push({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });

  const tocHtml = toc.length
    ? `<nav class="toc" aria-label="Mục lục"><div class="toc-title">Nội dung bài viết</div><ol>${toc.map((t) => `<li><a href="#${t.id}">${esc(t.txt)}</a></li>`).join("")}</ol></nav>`
    : "";
  const answerHtml = fm.answer
    ? `<div class="answer-box"><div class="ab-label">Trả lời nhanh</div><p>${inline(fm.answer)}</p></div>`
    : "";
  const faqHtml = faq.length
    ? `<section class="post-faq" aria-label="Câu hỏi thường gặp"><h2 id="faq">Câu hỏi thường gặp</h2>${faq.map((f) => `<details class="faq-item"><summary>${esc(f.q)}</summary><p>${inline(f.a)}</p></details>`).join("")}</section>`
    : "";
  const relatedHtml = related.length
    ? `<section class="post-related" aria-label="Bài liên quan"><h2>Đọc thêm</h2><ul>${related.map((r) => `<li><a href="${escAttr(r.url)}">${esc(r.title)}</a></li>`).join("")}</ul></section>`
    : "";
  const journeyHtml = journey.length
    ? `<div class="journey"><div class="journey-title">Lộ trình theo chặng</div><ol class="journey-list">${journey.map((s, i) => `<li><span class="jn">${i + 1}</span><div><div class="jt">${esc(s.title)}</div>${s.note ? `<div class="jd">${inline(s.note)}</div>` : ""}</div></li>`).join("")}</ol></div>`
    : "";
  // Box thương hiệu + sản phẩm (SEO: search "iki/ikihealing" → ra IKI + sản phẩm)
  const brandBoxHtml = `<section class="brand-box" aria-label="Sản phẩm và công cụ IKI">
          <h2>Sản phẩm &amp; công cụ IKI Healing</h2>
          <ul>
            <li><a href="../tai-lieu/">Tài liệu miễn phí</a> — cẩm nang &amp; ebook chăm sóc sức khoẻ chủ động (PDF), nhận qua email.</li>
            <li><a href="../quiz/">Kiểm tra thể trạng 90 giây</a> — nhận bản phân tích 6 chỉ số lối sống theo Đông y, miễn phí.</li>
            <li><a href="../hoc-vien.html">Học Viện IKI</a> — khoá học chăm sóc sức khoẻ chủ động (3 Ngày Reset · 7 Ngày Detox).</li>
            <li><a href="../app.html">App IKI</a> — nhật ký sức khoẻ cá nhân hoá (tuỳ chọn).</li>
            <li><strong>Thực phẩm bổ sung IKI:</strong> <a href="https://tra.ikihealing.com" target="_blank" rel="noopener noreferrer">Trà Tuệ Minh</a> · <a href="https://thanhhuongtra.ikihealing.com" target="_blank" rel="noopener noreferrer">Trà Thanh Hương</a> · <a href="https://trueveganprotein.com" target="_blank" rel="noopener noreferrer">Đạm thực vật True Vegan Protein</a>.</li>
          </ul>
        </section>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-N23BLRJD');</script>
  <!-- End Google Tag Manager -->
  <meta charset="UTF-8" />
  <!-- Google tag: GA4 + Google Ads (remarketing) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9X3LTTL2N3"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9X3LTTL2N3');gtag('config','AW-18332022859');</script>
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests; base-uri 'self'; object-src 'none'; form-action 'self' https://formsubmit.co https://formspree.io https://hope-ops-hub.vercel.app;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(clamp(fm.seo_title || fm.title, 60))}</title>
  <meta name="description" content="${escAttr(clamp(fm.description, 160))}" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="vi" href="${url}" />
  <link rel="alternate" hreflang="x-default" href="${url}" />

  <meta property="og:type" content="article" />
  <meta property="og:locale" content="vi_VN" />
  <meta property="og:site_name" content="IKI Healing — by HOPE CORP" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escAttr(fm.title)}" />
  <meta property="og:description" content="${escAttr(clamp(fm.description, 160))}" />
  <meta property="og:image" content="${escAttr(heroAbs)}" />
  <meta property="article:published_time" content="${escAttr(fm.date)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(fm.title)}" />
  <meta name="twitter:description" content="${escAttr(clamp(fm.description, 160))}" />
  <meta name="twitter:image" content="${escAttr(heroAbs)}" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/jpeg" href="../iki-logo-256.jpg" />
  <link rel="stylesheet" href="../styles.css" />
  <script src="../script.js" defer></script>

${ld.map((o) => `  <script type="application/ld+json">\n${JSON.stringify(o, (k, v) => v === undefined ? undefined : v, 2)}\n  </script>`).join("\n")}

  <style>
    .post-wrap{max-width:760px;margin:0 auto;padding:0 20px}
    .post-hero{max-width:1000px;margin:0 auto;padding:0 20px}
    .post-hero-img{width:100%;aspect-ratio:16/8;object-fit:cover;border-radius:18px;margin-top:16px}
    .post-eyebrow{display:inline-block;font-family:var(--font-sans,'Manrope');font-weight:700;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975)}
    .post-title{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:clamp(1.9rem,4.4vw,3rem);line-height:1.12;margin:.4rem 0 .6rem}
    .post-meta{font-size:.9rem;color:#667085;display:flex;gap:14px;flex-wrap:wrap;align-items:center;border-bottom:1px solid #eef0f3;padding-bottom:18px;margin-bottom:8px}
    .med-notice{background:#fef6e7;border:1px solid #f0d8a8;border-left:4px solid #d99a2b;border-radius:12px;padding:14px 18px;margin:22px 0;color:#8a5a12;font-size:.95rem;line-height:1.55}
    .med-notice a{color:#8a5a12;text-decoration:underline}
    .answer-box{background:linear-gradient(135deg,#f2f9ef,#eafaf5);border:1px solid #cdebdf;border-left:4px solid var(--iki-teal,#4BC0AB);border-radius:14px;padding:18px 22px;margin:26px 0}
    .answer-box .ab-label{font-weight:700;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975);margin-bottom:6px}
    .answer-box p{margin:0;font-size:1.06rem;line-height:1.6}
    .toc{background:#fafbfc;border:1px solid #eef0f3;border-radius:14px;padding:16px 22px;margin:26px 0}
    .toc-title{font-weight:700;font-size:.82rem;letter-spacing:.05em;text-transform:uppercase;color:#475467;margin-bottom:8px}
    .toc ol{margin:0;padding-left:20px} .toc a{color:var(--iki-teal-deep,#2E8975);text-decoration:none} .toc a:hover{text-decoration:underline}
    .post-body{font-family:var(--font-sans,'Manrope');font-size:1.09rem;line-height:1.78;color:#1d2430}
    .post-body h2{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:clamp(1.5rem,3vw,2.1rem);margin:2.2rem 0 .8rem;scroll-margin-top:90px}
    .post-body h3{font-weight:700;font-size:1.2rem;margin:1.6rem 0 .5rem;color:#101828}
    .post-body p{margin:0 0 1.1rem} .post-body ul,.post-body ol{margin:0 0 1.1rem;padding-left:24px} .post-body li{margin:.35rem 0}
    .post-body a{color:var(--iki-teal-deep,#2E8975);font-weight:600}
    .post-body blockquote{margin:1.4rem 0;padding:.6rem 0 .6rem 20px;border-left:4px solid var(--iki-lime,#A8D254);color:#475467;font-style:italic}
    .info-box{border-radius:14px;padding:16px 22px;margin:1.6rem 0}
    .info-box.ib-case{background:#fbf7ee;border:1px solid #ecdcbf} .info-box.ib-note{background:#f4f8ff;border:1px solid #d6e4fb}
    .info-box .ib-title{font-weight:700;color:#101828;margin-bottom:6px}
    .post-cta{background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB));border-radius:18px;padding:30px 26px;margin:34px 0;text-align:center;color:#fff}
    .post-cta h3{font-family:var(--font-display,'Cormorant Garamond');font-size:1.6rem;margin:0 0 8px;color:#fff}
    .post-cta p{margin:0 0 16px;opacity:.95}
    .post-fig{margin:26px auto;text-align:center}
    .post-fig img{max-width:min(420px,100%);border-radius:18px;box-shadow:0 10px 34px rgba(16,24,40,.14)}
    .post-fig figcaption{color:#98a2b3;font-size:.82rem;margin-top:10px}
    .post-faq{margin:34px 0} .post-faq h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.7rem;margin-bottom:12px}
    .post-related{margin:30px 0;border-top:1px solid #eef0f3;padding-top:22px} .post-related ul{padding-left:20px}
    .journey{margin:26px 0;background:#fafbfc;border:1px solid #eef0f3;border-radius:16px;padding:20px 24px}
    .journey-title{font-weight:700;font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975);margin-bottom:14px}
    .journey-list{list-style:none;margin:0;padding:0;counter-reset:jn}
    .journey-list li{display:flex;gap:14px;align-items:flex-start;padding:0 0 16px;position:relative}
    .journey-list li:not(:last-child)::before{content:"";position:absolute;left:15px;top:34px;bottom:0;width:2px;background:linear-gradient(#A8D254,#4BC0AB)}
    .journey-list .jn{flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB));color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:.95rem}
    .journey-list .jt{font-weight:700;color:#101828;padding-top:4px}
    .journey-list .jd{color:#475467;font-size:.95rem;line-height:1.55;margin-top:2px}
    .brand-box{margin:30px 0;background:linear-gradient(135deg,#f2f9ef,#eafaf5);border:1px solid #cdebdf;border-radius:16px;padding:20px 24px}
    .brand-box h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.5rem;margin:0 0 10px}
    .brand-box ul{margin:0;padding-left:20px} .brand-box li{margin:.4rem 0;color:#344054} .brand-box a{color:var(--iki-teal-deep,#2E8975);font-weight:700}
    .lead-cta{margin:30px 0}
    .lead-inner{background:linear-gradient(135deg,#12261f,#1c3a30);border-radius:20px;padding:32px 24px;text-align:center;color:#fff}
    .lead-cta .lead-tag{color:var(--iki-lime,#A8D254);font-weight:700;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}
    .lead-cta h2{font-family:var(--font-display,'Cormorant Garamond');font-size:1.7rem;margin:8px 0 6px;color:#fff}
    .lead-cta p{color:rgba(255,255,255,.82);margin:0 auto 18px;max-width:520px;font-size:1rem}
    .lead-row{display:flex;gap:10px;max-width:480px;margin:0 auto;flex-wrap:wrap}
    .lead-row input[type=email]{flex:1;min-width:200px;border:none;border-radius:12px;padding:13px 16px;font-size:1rem;font-family:inherit}
    .lead-phone{display:block;width:100%;max-width:480px;margin:10px auto 0;border:none;border-radius:12px;padding:11px 16px;font-size:.95rem;font-family:inherit}
    .lead-row button{border:none;border-radius:12px;padding:13px 22px;font-weight:700;font-size:1rem;color:#fff;background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB));cursor:pointer;font-family:inherit}
    .lead-consent{display:block;margin-top:12px;color:rgba(255,255,255,.6);font-size:.78rem} .lead-consent input{margin-right:6px}
    .post-disclaimer{font-size:.86rem;color:#667085;background:#fafbfc;border:1px solid #eef0f3;border-radius:12px;padding:14px 18px;margin:26px 0}
    @media(max-width:640px){.post-hero-img{aspect-ratio:4/3}}
  </style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N23BLRJD"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
  <div class="announcement-bar">
    Nhận <a href="../tai-lieu/">cẩm nang chăm sóc sức khoẻ (PDF)</a> miễn phí — gửi thẳng vào email của bạn.
  </div>

  <header class="site-header" id="site-header">
    <nav class="nav">
      <a class="brand" href="../index.html" aria-label="IKI Trang chủ">
        <img class="brand-logo" src="../iki-logo-256.jpg" alt="IKI logo" />
        <span>IKI <span class="brand-sub">By HOPE CORP</span></span>
      </a>
      <button class="nav-toggle" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="primary-nav">
        <svg class="icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg class="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <ul class="nav-links" id="primary-nav">
        <li><a href="../index.html">Trang chủ</a></li>
        <li><a href="../hoc-vien.html">Học Viện</a></li>
        <li><a href="index.html" class="active">Blog</a></li>
        <li><a href="../cong-dong.html">Cộng đồng</a></li>
        <li><a href="/shop">Sản phẩm</a></li>
        <li><a href="../app.html">Ứng dụng</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <div class="post-hero">
        <div style="max-width:760px;margin:0 auto">
          <span class="post-eyebrow">${esc(fm.category || "Chăm sóc sức khoẻ chủ động")}</span>
          <h1 class="post-title">${esc(fm.title)}</h1>
          <div class="post-meta">
            <span>${esc(author)}</span><span>·</span>
            <span>Cập nhật ${esc(fm.updated || fm.date)}</span><span>·</span>
            <span>${readMin} phút đọc</span>
          </div>
        </div>
        ${heroSrc ? `<img class="post-hero-img" src="${escAttr(heroSrc)}" alt="${escAttr(fm.hero_alt || fm.title)}" />` : ""}
      </div>

      <div class="post-wrap">
        ${fm.no_product ? `<div class="med-notice" role="note"><strong>Lưu ý y khoa:</strong> Bài viết cung cấp kiến thức tham khảo, không nhằm chẩn đoán hay thay thế thăm khám, tư vấn của bác sĩ. Nếu có dấu hiệu bất thường, hãy đến cơ sở y tế. Xem thêm <a href="mien-tru-trach-nhiem.html">Miễn trừ trách nhiệm</a>.</div>` : ""}
        ${answerHtml}
        ${journeyHtml}
        ${tocHtml}
        <div class="post-body">
${article}
        </div>

        ${fm.no_product ? "" : `<div class="post-cta">
          <h3>Nhận cẩm nang chăm sóc sức khoẻ chủ động — miễn phí</h3>
          <p>Để lại email, chúng tôi gửi ngay cẩm nang PDF theo thể trạng của bạn. Hoặc <a href="../quiz/">kiểm tra thể trạng 90 giây</a> để nhận bản phân tích cá nhân hoá.</p>
          <a class="btn btn-primary" href="../tai-lieu/">Nhận cẩm nang miễn phí →</a>
        </div>`}

        ${faqHtml}
        ${emailCta(PLAN, "article:" + fm.slug)}
        ${fm.no_product ? "" : brandBoxHtml}
        ${relatedHtml}

        <div class="post-disclaimer">
          Nội dung mang tính chia sẻ kiến thức chăm sóc sức khoẻ chủ động, không thay thế chẩn đoán hoặc tư vấn y khoa. Các sản phẩm IKI là <strong>thực phẩm bổ sung</strong>, không phải thuốc và không có tác dụng thay thế thuốc chữa bệnh. Khi có vấn đề sức khoẻ, hãy tham khảo ý kiến bác sĩ.
        </div>
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand" style="display:flex;flex-direction:column;align-items:flex-start;gap:14px;margin-bottom:14px;font-size:0"><span style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;background:linear-gradient(160deg,#173A2C,#0E241B);border:1px solid rgba(245,197,24,.22);border-radius:14px;padding:12px 22px 10px"><img src="/assets/logo/hope-mark-512.png" alt="HOPE CORP" style="width:30px;height:auto;margin-bottom:3px" /><span style="font-weight:800;letter-spacing:.18em;color:#F7F3E8;font-size:.82rem;line-height:1">HOPE</span><span style="font-weight:800;letter-spacing:.3em;color:#F5C518;font-size:.58rem">CORP</span></span></div><div class="footer-company" style="margin:0 0 16px"><div style="font-weight:800;text-transform:uppercase;color:#FFFFFF;font-size:1.02rem;line-height:1.3;letter-spacing:.005em">Công ty Cổ phần TM&amp;DV HOPE</div><div style="margin-top:6px;font-weight:500;text-transform:uppercase;color:rgba(255,255,255,.52);font-size:.7rem;letter-spacing:.22em">From nature, for life</div></div>
          <p>Platform công nghệ wellness cho người Việt — kế thừa tri thức Y học Cổ truyền Việt Nam qua Tuệ Tĩnh và Hải Thượng Lãn Ông. Sản phẩm của Công ty Cổ phần TMDV HOPE (MST 0801404967). Cố vấn chuyên môn: TS. Ngô Đức Vượng.</p>
        </div>
        <div>
          <h4>Hệ sinh thái</h4>
          <ul>
            <li><a href="../hoc-vien.html">Học Viện IKI</a></li>
            <li><a href="index.html">Blog IKI</a></li>
            <li><a href="../cong-dong.html">Cộng đồng IKI</a></li>
            <li><a href="../app.html">Ứng dụng IKI</a></li>
            <li><a href="../ve-hope.html">Về HOPE CORP</a></li>
          </ul>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <ul>
            <li><a href="../cong-nghe.html">Công nghệ IKI</a></li>
            <li><a href="../chinh-sach-bao-mat.html">Chính sách bảo mật</a></li>
            <li><a href="mailto:contact@ikihealing.com">Liên hệ</a></li>
          </ul>
        </div>
        <div>
          <h4>Đối tác</h4>
          <ul>
            <li><a href="https://ebook.beginguru.com/blog/" target="_blank" rel="noopener noreferrer">BeginGuru</a></li>
          </ul>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <ul class="contact-list">
            <li class="contact-item"><span class="contact-label">Email</span><a href="mailto:contact@ikihealing.com">contact@ikihealing.com</a></li>
            <li class="contact-item"><span class="contact-label">Tư vấn</span><a href="tel:0987931551">0987.931.551</a></li>
            <li class="contact-item"><span class="contact-label">Trụ sở</span>63/253 Ngô Quyền, P. Lê Thanh Nghị, TP Hải Phòng</li>
          </ul>
        </div>
      </div>
      <div class="global-disclaimer">
        <p>Các sản phẩm là <strong style="color:rgba(255,255,255,0.78);">thực phẩm bổ sung</strong>, không phải thuốc và không có tác dụng thay thế thuốc chữa bệnh. Kết quả có thể khác nhau tuỳ cơ địa.</p>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Công ty Cổ phần TMDV HOPE — IKI là thương hiệu được sở hữu và vận hành bởi HOPE CORP.</span> <a href="mien-tru-trach-nhiem.html" style="color:rgba(255,255,255,0.7);text-decoration:underline">Miễn trừ trách nhiệm</a>
      </div>
    </div>
  </footer>
${BEACON}
${EXIT_POPUP}
</body>
</html>
`;
}

function buildOne(srcPath) {
  const raw = fs.readFileSync(srcPath, "utf8");
  const { fm, body } = parseSource(raw);
  if (!fm.slug) throw new Error(`${srcPath}: thiếu "slug"`);
  const outDir = path.join(ROOT, "blog");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${fm.slug}.html`);
  fs.writeFileSync(outPath, render(fm, body), "utf8");
  console.log(`✓ ${path.relative(ROOT, srcPath)} → blog/${fm.slug}.html`);
  return { fm, outPath };
}


function main() {
  const args = process.argv.slice(2);
  let files = args.filter((a) => !a.startsWith("--"));
  if (args.includes("--all") || !files.length) {
    const d = path.join(ROOT, "blog-drafts");
    files = fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(".md")).map((f) => path.join(d, f)) : [];
  }
  if (!files.length) { console.error("Không có file nguồn trong blog-drafts/."); process.exit(1); }
  for (const f of files) buildOne(path.isAbsolute(f) ? f : path.join(ROOT, f));
  buildStructure();
}

main();
