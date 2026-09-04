#!/usr/bin/env node
/**
 * build-tailieu.mjs — "Kho tài liệu có cổng email".
 * Sinh trang tĩnh /tai-lieu/ để nhân viên gửi link cho khách; khách điền email/SĐT
 * -> nhận file -> email chảy vào phễu nuôi 30 ngày (/api/blog-lead của ops-hub).
 *   - tai-lieu/index.html        (danh mục tài liệu)
 *   - tai-lieu/<slug>.html       (trang cổng: form email -> lộ nút tải)
 *   - tai-lieu/manifest.json     (danh sách tài liệu — ops-hub đọc để chia link)
 *
 * Nhân viên gửi link kèm tên mình:  https://ikihealing.com/tai-lieu/<slug>?s=<ten-sale>
 *   -> source lead = "tailieu:<slug>:<ten-sale>" (đo được ai mang về khách).
 *
 * TỰ CHỨA (không import head/header của blog vì chúng dùng path tương-đối-với /blog).
 * THÊM TÀI LIỆU MỚI: thêm 1 mục vào DOCS + để file vào assets/ hoặc ebook/ -> chạy lại script.
 * (Nhớ thêm mục tương ứng ở hope-ops-hub app/chia-tai-lieu để hiện link chia sẻ.)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://ikihealing.com";
const FORM_ACTION = "https://hope-ops-hub.vercel.app/api/blog-lead";
const AW_LEAD = "AW-18332022859/NzdQCOH0m9YcEMvwsaVE"; // nhãn chuyển đổi "Lead" (khớp cam-on.html)

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

// ---- Danh mục tài liệu gửi cho KHÁCH (chỉ tài liệu HOPE tự sở hữu; KHÔNG dùng sách nguồn nước ngoài) ----
const DOCS = [
  {
    slug: "cam-nang-suc-khoe-chu-dong",
    title: "Cẩm nang chăm sóc sức khoẻ chủ động",
    tag: "Cẩm nang · PDF miễn phí",
    desc: "Bộ nguyên tắc nền tảng để bắt đầu chăm sóc sức khoẻ chủ động mỗi ngày — ăn uống cân bằng, thói quen nhỏ dễ giữ và cách lắng nghe cơ thể mình.",
    file: "/assets/cam-nang-cham-soc-suc-khoe-chu-dong.pdf",
    benefits: [
      "Nguyên tắc ăn uống cân bằng theo ngày",
      "Những thói quen nhỏ dễ duy trì lâu dài",
      "Cách lắng nghe tín hiệu của cơ thể",
    ],
  },
  {
    slug: "lang-nghe-co-the",
    title: "Lắng nghe cơ thể",
    tag: "Ebook · PDF miễn phí",
    desc: "Ebook chia sẻ cách quan sát và hiểu các tín hiệu của cơ thể để điều chỉnh lối sống, ăn uống và nghỉ ngơi phù hợp với riêng bạn.",
    file: "/ebook/lang-nghe-co-the.pdf",
    benefits: [
      "Đọc hiểu các tín hiệu cơ thể gửi mỗi ngày",
      "Điều chỉnh lối sống theo thể trạng của bạn",
      "Nền tảng để chăm sóc sức khoẻ chủ động",
    ],
  },
];

function head(title, desc, canonical) {
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
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests; base-uri 'self'; object-src 'none'; form-action 'self' https://hope-ops-hub.vercel.app;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${escAttr(desc)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="vi_VN" />
  <meta property="og:site_name" content="IKI Healing — by HOPE CORP" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escAttr(title)}" />
  <meta property="og:description" content="${escAttr(desc)}" />
  <meta property="og:image" content="${SITE}/assets/banners/iki-banner-1200x630-og.jpg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/jpeg" href="/iki-logo-256.jpg" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="/script.js" defer></script>
  <style>
    .tl-hero{max-width:900px;margin:0 auto;padding:44px 20px 8px;text-align:center}
    .tl-hero .eyebrow{color:var(--iki-teal-deep,#2E8975);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.8rem}
    .tl-hero h1{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:clamp(2rem,5vw,3rem);margin:.4rem 0 .5rem}
    .tl-hero p{color:#667085;max-width:620px;margin:0 auto;font-size:1.05rem}
    .tl-grid{max-width:960px;margin:22px auto 0;padding:0 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
    .tl-card{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid #eef0f3;border-top:3px solid var(--iki-teal,#4BC0AB);border-radius:16px;padding:20px 22px;text-decoration:none;color:inherit;box-shadow:0 1px 2px rgba(16,24,40,.04);transition:transform .15s,box-shadow .15s}
    .tl-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(16,24,40,.10)}
    .tl-tag{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--iki-teal-deep,#2E8975)}
    .tl-card h2{font-family:var(--font-display,'Cormorant Garamond');font-weight:700;font-size:1.35rem;line-height:1.2;margin:0}
    .tl-card p{color:#475467;font-size:.93rem;line-height:1.5;margin:0}
    .tl-card .tl-go{margin-top:auto;font-weight:700;color:var(--iki-teal-deep,#2E8975);font-size:.92rem}
    .tl-wrap{max-width:640px;margin:24px auto 40px;padding:0 20px}
    .tl-box{background:linear-gradient(135deg,#12261f,#1c3a30);border-radius:22px;padding:36px 28px;color:#fff}
    .tl-box .tl-tag{color:var(--iki-lime,#A8D254)}
    .tl-box h1{font-family:var(--font-display,'Cormorant Garamond');font-size:clamp(1.7rem,3.6vw,2.3rem);margin:8px 0 8px;color:#fff}
    .tl-box .lead-desc{color:rgba(255,255,255,.85);margin:0 0 16px}
    .tl-benefits{list-style:none;margin:0 0 20px;padding:0;display:flex;flex-direction:column;gap:8px}
    .tl-benefits li{color:rgba(255,255,255,.9);font-size:.95rem;padding-left:26px;position:relative}
    .tl-benefits li::before{content:"";position:absolute;left:0;top:3px;width:16px;height:16px;border-radius:50%;background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB))}
    .tl-form input[type=email],.tl-form input[type=tel]{display:block;width:100%;border:none;border-radius:12px;padding:14px 16px;font-size:1rem;font-family:inherit;margin-bottom:10px}
    .tl-form button{width:100%;border:none;border-radius:12px;padding:14px 24px;font-weight:700;font-size:1rem;color:#fff;background:var(--iki-gradient,linear-gradient(135deg,#A8D254,#4BC0AB));cursor:pointer;font-family:inherit}
    .tl-form button:hover{opacity:.94} .tl-form button:disabled{opacity:.7;cursor:default}
    .iki-dy{margin:0 0 10px;text-align:left}
    .iki-dy label{display:flex;align-items:flex-start;gap:8px;margin:0 0 6px;font-size:.8rem;font-weight:400;color:rgba(255,255,255,.8);line-height:1.45;cursor:pointer}
    .iki-dy input[type=checkbox]{width:16px;height:16px;flex:none;margin:2px 0 0;accent-color:var(--iki-lime,#A8D254)}
    .iki-dy-coso{font-size:.76rem;color:rgba(255,255,255,.62);line-height:1.45;margin:6px 0 0}
    .iki-dy-coso a{color:var(--iki-lime,#A8D254);text-decoration:underline}
    .tl-msg{color:#ffd7cf;font-size:.88rem;margin:10px 0 0;min-height:1em}
    .tl-ready .btn{display:inline-block;margin-bottom:10px}
    .tl-ready p{color:rgba(255,255,255,.85);font-size:.92rem;margin:0}
    .tl-note{max-width:640px;margin:0 auto 40px;padding:0 20px;color:#98a2b3;font-size:.82rem;text-align:center;line-height:1.5}
  </style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N23BLRJD"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
}

function header() {
  return `
  <div class="announcement-bar"><a href="/quiz/">Kiểm tra thể trạng 90 giây</a> — nhận bản phân tích 6 chỉ số theo Đông y, miễn phí.</div>
  <header class="site-header" id="site-header">
    <nav class="nav">
      <a class="brand" href="/index.html" aria-label="IKI Trang chủ"><img class="brand-logo" src="/iki-logo-256.jpg" alt="IKI logo" /><span>IKI <span class="brand-sub">By HOPE CORP</span></span></a>
      <button class="nav-toggle" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="primary-nav">
        <svg class="icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg class="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <ul class="nav-links" id="primary-nav">
        <li><a href="/index.html">Trang chủ</a></li>
        <li><a href="/hoc-vien.html">Học Viện</a></li>
        <li><a href="/blog/index.html">Blog</a></li>
        <li><a href="/cong-dong.html">Cộng đồng</a></li>
        <li><a href="https://ikihealing.com/shop" target="_blank" rel="noopener noreferrer">Sản phẩm ↗</a></li>
        <li><a href="/app.html">Ứng dụng</a></li>
      </ul>
    </nav>
  </header>`;
}

const footer = () => `
  <footer class="site-footer"><div class="container">
    <div class="footer-grid">
      <div><div class="footer-brand" style="display:flex;flex-direction:column;align-items:flex-start;gap:14px;margin-bottom:14px;font-size:0"><span style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;background:linear-gradient(160deg,#173A2C,#0E241B);border:1px solid rgba(245,197,24,.22);border-radius:14px;padding:12px 22px 10px"><img src="/assets/logo/hope-mark-512.png" alt="HOPE CORP" style="width:30px;height:auto;margin-bottom:3px" /><span style="font-weight:800;letter-spacing:.18em;color:#F7F3E8;font-size:.82rem;line-height:1">HOPE</span><span style="font-weight:800;letter-spacing:.3em;color:#F5C518;font-size:.58rem">CORP</span></span></div><div class="footer-company" style="margin:0 0 16px"><div style="font-weight:800;text-transform:uppercase;color:#FFFFFF;font-size:1.02rem;line-height:1.3;letter-spacing:.005em">Công ty Cổ phần TMDV HOPE</div><div style="margin-top:6px;font-weight:500;text-transform:uppercase;color:rgba(255,255,255,.52);font-size:.7rem;letter-spacing:.22em">From nature, for life</div></div><p>Platform công nghệ wellness cho người Việt — kế thừa tri thức Y học Cổ truyền Việt Nam. Sản phẩm của Công ty Cổ phần TMDV HOPE (MST 0801404967).</p></div>
      <div><h4>Hệ sinh thái</h4><ul><li><a href="/hoc-vien.html">Học Viện IKI</a></li><li><a href="/blog/index.html">Blog IKI</a></li><li><a href="/cong-dong.html">Cộng đồng IKI</a></li><li><a href="/app.html">Ứng dụng IKI</a></li></ul></div>
      <div><h4>Tài liệu</h4><ul><li><a href="/tai-lieu/index.html">Tài liệu miễn phí</a></li><li><a href="/blog/lo-trinh.html">Lộ trình chăm sóc</a></li></ul></div>
      <div><h4>Liên hệ</h4><ul class="contact-list"><li class="contact-item"><span class="contact-label">Email</span><a href="mailto:contact@ikihealing.com">contact@ikihealing.com</a></li><li class="contact-item"><span class="contact-label">Tư vấn</span><a href="tel:0987931551">0987.931.551</a></li></ul></div>
    </div>
    <div class="global-disclaimer"><p>Các sản phẩm là <strong style="color:rgba(255,255,255,0.78);">thực phẩm bổ sung</strong>, không phải thuốc và không có tác dụng thay thế thuốc chữa bệnh. Kết quả có thể khác nhau tuỳ cơ địa.</p></div>
    <div class="footer-bottom"><span>© 2026 Công ty Cổ phần TMDV HOPE — IKI là thương hiệu của HOPE CORP.</span></div>
  </div></footer>
<!-- Zalo OA chat widget -->
<style>
  .zalo-chat-widget{right:16px!important;bottom:24px!important;z-index:95!important}
  @media (max-width:880px){.zalo-chat-widget{bottom:92px!important}}
</style>
<div class="zalo-chat-widget"
     data-oaid="599407064751177637"
     data-welcome-message="Chào bạn, IKI có thể hỗ trợ gì cho bạn?"
     data-autopopup="0"
     data-width="350"
     data-height="420"></div>
<script src="https://sp.zalo.me/plugins/sdk.js" async defer></script>
<!-- End Zalo OA chat widget -->
  <script src="/assets/kiem-form.js" defer></script>
</body>
</html>`;

function docPage(d) {
  const canonical = `${SITE}/tai-lieu/${d.slug}.html`;
  const benefits = d.benefits.map((b) => `<li>${esc(b)}</li>`).join("");
  const dlLabel = `Tải ${esc(d.title)} →`;
  const script = `<script>(function(){
  var slug=${JSON.stringify(d.slug)}, file=${JSON.stringify(d.file)};
  var q=new URLSearchParams(location.search), s=(q.get('s')||'').trim();
  var source='tailieu:'+slug+(s?(':'+s):'');
  var form=document.getElementById('dlForm'), ready=document.getElementById('dlReady'), msg=document.getElementById('dlMsg');
  function reveal(){ form.style.display='none'; ready.hidden=false; }
  function ikiDongY(box){box=(typeof box==='string')?document.querySelector(box):box;if(!box)return null;var vb=[],t=false;box.querySelectorAll('label').forEach(function(l){var c=l.querySelector('input[type=checkbox]');if(!c)return;if(c.id.indexOf('dyTin')===0)t=c.checked;vb.push((c.checked?'[x] ':'[ ] ')+(l.querySelector('span')||l).textContent.replace(/\\s+/g,' ').trim());});var cs=box.querySelector('.iki-dy-coso');if(cs)vb.push('[x] '+cs.textContent.replace(/\\s+/g,' ').trim());return {tinTuVan:t,vanBan:vb.join(' | '),phienBan:'v1-2026-09-04'};}
  if(localStorage.getItem('iki_lead_ok')) reveal();
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(form._honey&&form._honey.value.trim()) return;
    var email=(form.email.value||'').trim();
    if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ msg.textContent='Email chưa đúng, bạn kiểm tra lại giúp nhé.'; return; }
    var btn=form.querySelector('button'); btn.disabled=true; btn.textContent='Đang gửi...';
    fetch(${JSON.stringify(FORM_ACTION)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,phone:(form.phone.value||'').trim(),source:source,dongY:ikiDongY(form),_honey:''})})
    .then(function(r){return r.json();}).then(function(dd){
      if(dd&&dd.ok){ try{localStorage.setItem('iki_lead_ok','1');}catch(e){}
        try{if(typeof gtag==='function'){gtag('event','generate_lead',{event_category:'tai-lieu',event_label:slug});gtag('event','conversion',{send_to:${JSON.stringify(AW_LEAD)},value:1.0,currency:'VND',transaction_id:''});}}catch(e){}
        reveal();
      } else { btn.disabled=false; btn.textContent='Nhận tài liệu →'; msg.textContent='Có lỗi nhỏ, bạn thử lại giúp nhé.'; }
    }).catch(function(){ btn.disabled=false; btn.textContent='Nhận tài liệu →'; msg.textContent='Mạng chậm, bạn thử lại giúp nhé.'; });
  });
})();</script>`;
  return head(`${d.title} | Tài liệu miễn phí IKI`, d.desc, canonical)
    + header()
    + `<main>
  <section class="tl-hero"><span class="eyebrow">Tài liệu miễn phí</span><h1>${esc(d.title)}</h1></section>
  <div class="tl-wrap"><div class="tl-box">
    <span class="tl-tag">${esc(d.tag)}</span>
    <h1>${esc(d.title)}</h1>
    <p class="lead-desc">${esc(d.desc)}</p>
    <ul class="tl-benefits">${benefits}</ul>
    <form id="dlForm" class="tl-form" novalidate>
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" />
      <input type="email" name="email" placeholder="Email của bạn..." required aria-label="Email" />
      <input type="tel" name="phone" placeholder="Số điện thoại (không bắt buộc — để được tư vấn thêm)" aria-label="Số điện thoại" />
      <div class="iki-dy">
        <label><input type="checkbox" id="dyTin" /><span>Tôi muốn nhận thêm bài viết, thực đơn và ưu đãi từ IKI qua email/Zalo. Có thể ngừng bất cứ lúc nào.</span></label>
        <p class="iki-dy-coso">Khi bấm gửi, bạn đồng ý để IKI Healing (Công ty CP TMDV HOPE) dùng email/số điện thoại để gửi tài liệu và tư vấn thêm theo <a href="https://ikihealing.com/chinh-sach-bao-mat.html" target="_blank" rel="noopener">Chính sách dữ liệu</a>.</p>
      </div>
      <button type="submit">Nhận tài liệu →</button>
      <p class="tl-msg" id="dlMsg" role="status"></p>
    </form>
    <div id="dlReady" class="tl-ready" hidden>
      <a class="btn btn-primary" href="${escAttr(d.file)}" target="_blank" rel="noopener">${dlLabel}</a>
      <p>Cảm ơn bạn! Tài liệu đã sẵn sàng. IKI cũng sẽ gửi thêm vài gợi ý chăm sóc sức khoẻ nhỏ, dễ làm vào email của bạn trong những ngày tới.</p>
    </div>
  </div>
  <p class="tl-note">Nội dung mang tính chia sẻ kiến thức chăm sóc sức khoẻ chủ động, không nhằm chẩn đoán hay thay thế tư vấn y khoa. Sản phẩm của IKI là thực phẩm bổ sung, không phải thuốc.</p>
  </div>
  ${script}
</main>`
    + footer();
}

function indexPage() {
  const canonical = `${SITE}/tai-lieu/index.html`;
  const cards = DOCS.map((d) => `<a class="tl-card" href="${d.slug}.html">
    <span class="tl-tag">${esc(d.tag)}</span>
    <h2>${esc(d.title)}</h2>
    <p>${esc(d.desc)}</p>
    <span class="tl-go">Nhận tài liệu →</span>
  </a>`).join("\n");
  return head("Tài liệu chăm sóc sức khoẻ miễn phí | IKI Healing",
    "Tải miễn phí các cẩm nang và ebook chăm sóc sức khoẻ chủ động từ IKI Healing.", canonical)
    + header()
    + `<main>
  <section class="tl-hero"><span class="eyebrow">Tài liệu miễn phí</span><h1>Tài liệu chăm sóc sức khoẻ chủ động</h1><p>Cẩm nang và ebook do IKI biên soạn — để lại email là nhận được ngay.</p></section>
  <div class="tl-grid">${cards}</div>
  <p class="tl-note">Nội dung mang tính chia sẻ kiến thức, không nhằm chẩn đoán hay thay thế tư vấn y khoa. Sản phẩm của IKI là thực phẩm bổ sung, không phải thuốc.</p>
</main>`
    + footer();
}

function updateSitemap() {
  const sp = path.join(ROOT, "sitemap.xml");
  if (!fs.existsSync(sp)) return;
  let xml = fs.readFileSync(sp, "utf8");
  const today = "2026-07-26";
  const url = (loc, pri) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
  const urls = [url(`${SITE}/tai-lieu/`, "0.7"), ...DOCS.map((d) => url(`${SITE}/tai-lieu/${d.slug}.html`, "0.6"))];
  const block = `  <!-- TAILIEU:START (tự sinh bởi build-tailieu.mjs — đừng sửa tay) -->\n${urls.join("\n")}\n  <!-- TAILIEU:END -->`;
  if (/<!-- TAILIEU:START[\s\S]*?TAILIEU:END -->/.test(xml)) xml = xml.replace(/  <!-- TAILIEU:START[\s\S]*?TAILIEU:END -->/, block);
  else xml = xml.replace(/<\/urlset>/, `${block}\n\n</urlset>`);
  fs.writeFileSync(sp, xml, "utf8");
}

function build() {
  const outDir = path.join(ROOT, "tai-lieu");
  fs.mkdirSync(outDir, { recursive: true });
  for (const d of DOCS) {
    const f = path.join(ROOT, d.file.replace(/^\//, ""));
    if (!fs.existsSync(f)) console.warn(`  ! THIẾU FILE: ${d.file} (trang ${d.slug} vẫn dựng, nhưng nút tải sẽ 404)`);
    fs.writeFileSync(path.join(outDir, `${d.slug}.html`), docPage(d), "utf8");
  }
  fs.writeFileSync(path.join(outDir, "index.html"), indexPage(), "utf8");
  fs.writeFileSync(path.join(outDir, "manifest.json"),
    JSON.stringify(DOCS.map(({ slug, title, tag }) => ({ slug, title, tag })), null, 2), "utf8");
  updateSitemap();
  console.log(`✓ tai-lieu: index + ${DOCS.length} trang tài liệu + manifest.json`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();
export { DOCS, build };
