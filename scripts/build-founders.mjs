#!/usr/bin/env node
/**
 * build-founders.mjs — DỰNG CHUYÊN MỤC "FOUNDERS" (VI / EN / JA) TỪ MỘT NGUỒN.
 *
 * Vì sao có (13/10/2026): CEO muốn một chuyên mục riêng cho bài viết của hai nhà sáng lập
 * (Nguyễn Văn Hưng, Phạm Ngọc Thanh Tâm) để gửi link cho nhà đầu tư / đối tác các nước.
 * Bài phải đọc được bằng tiếng Việt, Anh, Nhật — nên mỗi bài là MỘT file JSON chứa đủ 3 thứ tiếng,
 * máy này đắp vào khung trang tin tức sẵn có (tin-tuc/claude-startups.html và bản en/ja) để
 * giữ nguyên menu, chân trang, GTM, CSP, chọn ngôn ngữ.
 *
 * Nguồn:  founders-src/_authors.json      hồ sơ 2 tác giả (3 thứ tiếng)
 *         founders-src/<slug>.json         { slug, author, date, vi:{title,desc,eyebrow,body}, en:{…}, ja:{…} }
 *         body = Markdown rút gọn: đoạn cách dòng trống, "## " tiêu đề, "- " gạch đầu dòng,
 *         "> " khối ghi chú, **đậm**, [chữ](link).
 * Đích:   founders/index.html, founders/<slug>.html
 *         en/founders/…, ja/founders/…
 *
 * Chạy:   node scripts/build-founders.mjs
 * Chốt:   cổng từ cấm chạy trên CẢ BA thứ tiếng; dính là dừng, không ghi file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ikihealing.com";
const SRC = path.join(ROOT, "founders-src");
const LANGS = ["vi", "en", "ja"];
const TPL = { vi: "tin-tuc/claude-startups.html", en: "en/news/claude-startups.html", ja: "ja/news/claude-startups.html" };
const BASE = { vi: "/founders/", en: "/en/founders/", ja: "/ja/founders/" };
const OLD = { vi: "/tin-tuc/claude-startups.html", en: "/en/news/claude-startups.html", ja: "/ja/news/claude-startups.html" };

const T = {
  vi: { hub: "Founders — Ghi chép của nhà sáng lập", hubDesc: "Ghi chép của hai nhà sáng lập HOPE CORP về cách xây một doanh nghiệp D2C chăm sóc sức khoẻ và sắc đẹp vận hành bằng AI tại Việt Nam.", eyebrow: "FOUNDERS · HOPE CORP", intro: "Những gì chúng tôi học được khi xây IKI: vận hành bằng AI, kỷ luật số liệu, rào pháp lý và cộng đồng. Viết cho nhà đầu tư, đối tác và những người cùng xây doanh nghiệp.", by: "Tác giả", all: "Tất cả bài viết", read: "Đọc bài", back: "Về chuyên mục Founders", soon: "Bài viết đang được biên tập, sẽ cập nhật sớm.", posts: "Bài viết", contact: "Liên hệ hợp tác / đầu tư", invest: "Tổng quan cho nhà đầu tư", min: "phút đọc", profile: "Xem hồ sơ đầy đủ", ebookCta: "Tải ebook miễn phí (PDF)", ebookEyebrow: "EBOOK MIỄN PHÍ", note: "Nội dung chia sẻ kinh nghiệm vận hành doanh nghiệp. Sản phẩm IKI là thực phẩm bổ sung, không phải thuốc và không có tác dụng thay thế thuốc chữa bệnh." },
  en: { hub: "Founders — Notes from the founders", hubDesc: "Notes from the two founders of HOPE CORP on building an AI-operated D2C health and beauty company in Vietnam.", eyebrow: "FOUNDERS · HOPE CORP", intro: "What we have learned building IKI: AI-run operations, data discipline, regulatory guardrails and community. Written for investors, partners and fellow builders.", by: "Author", all: "All articles", read: "Read", back: "Back to Founders", soon: "Articles are being edited and will be published soon.", posts: "Articles", contact: "Partnership / investment enquiries", invest: "Investor overview", min: "min read", profile: "View full profile", ebookCta: "Download the free ebook (PDF)", ebookEyebrow: "FREE EBOOK", note: "This content shares business operating experience. IKI products are dietary supplements; they are not medicines and do not replace medical treatment." },
  ja: { hub: "Founders — 創業者ノート", hubDesc: "HOPE CORPの2人の創業者が、ベトナムでAIを活用したD2Cヘルス＆ビューティー企業をつくる過程を綴るノートです。", eyebrow: "FOUNDERS · HOPE CORP", intro: "IKIをつくる中で学んだこと：AIによる運営、数字の規律、法規制のガードレール、コミュニティ。投資家・パートナー、そして共に事業をつくる方々へ。", by: "著者", all: "すべての記事", read: "読む", back: "Founders一覧へ", soon: "記事は現在編集中です。近日公開予定です。", posts: "記事", contact: "提携・投資のお問い合わせ", invest: "投資家向け概要", min: "分で読めます", profile: "プロフィールを見る", ebookCta: "無料電子書籍をダウンロード(PDF)", ebookEyebrow: "無料電子書籍", note: "本コンテンツは事業運営の経験を共有するものです。IKIの製品は栄養補助食品であり、医薬品ではなく、治療の代わりにはなりません。" },
};

// Cổng từ cấm — áp cho cả ba thứ tiếng (thực phẩm bổ sung, không claim y học, khuyến mãi = tặng quà).
const CAM = {
  vi: [/\bchữa\b/i, /\bđiều trị\b/i, /\btrị bệnh\b/i, /khỏi bệnh/i, /thải độc/i, /thực phẩm chức năng/i, /hiệu quả sau \d+ ngày/i, /giảm \d+\s?%/i, /chiết khấu \d+\s?%/i],
  en: [/\bcures?\b/i, /\bdetoxif/i, /\bheals? (?:disease|illness)/i, /\btreats? (?:disease|illness|cancer|diabetes)/i, /\bfunctional food\b/i, /\d+\s?% (?:off|discount)/i],
  ja: [/治療/, /治す/, /完治/, /デトックス効果/, /解毒/, /機能性食品/, /\d+\s?%\s?(?:OFF|オフ|割引)/i],
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`);

function md(body) {
  const out = [];
  for (const block of String(body).trim().split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    if (lines[0].startsWith("## ")) { out.push(`<h2>${inline(lines[0].slice(3))}</h2>`); if (lines.length > 1) out.push(`<p>${inline(lines.slice(1).join(" "))}</p>`); continue; }
    if (lines[0].startsWith("### ")) { out.push(`<h3>${inline(lines[0].slice(4))}</h3>`); if (lines.length > 1) out.push(`<p>${inline(lines.slice(1).join(" "))}</p>`); continue; }
    if (lines.every((l) => /^\s*-\s/.test(l))) { out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*-\s/, ""))}</li>`).join("")}</ul>`); continue; }
    if (lines.every((l) => /^\s*\d+\.\s/.test(l))) { out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s/, ""))}</li>`).join("")}</ol>`); continue; }
    if (lines.every((l) => l.startsWith(">"))) { out.push(`<p class="note">${inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</p>`); continue; }
    out.push(`<p>${inline(lines.join(" "))}</p>`);
  }
  return out.join("\n");
}

const plain = (s) => String(s).replace(/[#*>\-\[\]()]/g, " ");
const minutes = (lang, body) => Math.max(1, Math.round(lang === "ja" ? plain(body).replace(/\s/g, "").length / 500 : plain(body).split(/\s+/).filter(Boolean).length / 230));

function shell(lang, { title, desc, canonicalPath, altPaths, ogImage, ld, main }) {
  let h = fs.readFileSync(path.join(ROOT, TPL[lang]), "utf8");
  const head = h.slice(0, h.indexOf("<main"));
  const foot = h.slice(h.indexOf("</main>") + 7);
  let out = head
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${SITE}${ogImage}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
    .replace(/<style>[\s\S]*?<\/style>/, `<style>${CSS}</style>`);
  // canonical, hreflang, og:url và nút chọn ngôn ngữ đều trỏ về đường dẫn trang khuôn -> thay một lượt
  for (const l of LANGS) out = out.split(OLD[l]).join(altPaths[l]);
  if (out.includes("claude-startups")) throw new Error(`Khuôn ${lang} còn sót đường dẫn trang gốc`);
  return `${out}<main id="main">${main}</main>${foot}`;
}

const CSS = `
.fd{background:#fff;color:var(--ink)}
.fd .wrap{max-width:860px}
.fd header.nh{padding:64px 0 28px;border-bottom:1px solid var(--line)}
.fd h1{font-size:42px;line-height:1.15;letter-spacing:-.5px;margin:0 0 16px;color:var(--plum)}
.fd .lead{font-size:18px;line-height:1.65;color:var(--muted);margin:0}
.fd .meta{color:var(--muted);font-size:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.fd .meta img{width:36px;height:36px;border-radius:50%;object-fit:cover}
.fd .body{padding:32px 0 48px;font-size:17px;line-height:1.75}
.fd .body h2{font-size:26px;line-height:1.3;margin:40px 0 12px;color:var(--plum)}
.fd .body h3{font-size:20px;line-height:1.35;margin:28px 0 8px;color:var(--plum)}
.fd .body ul,.fd .body ol{padding-left:22px}
.fd .body li{margin:6px 0}
.fd .body a{color:var(--rose);text-decoration:underline}
.fd .note{border-left:3px solid var(--rose);padding:12px 18px;background:#fff;border:1px solid var(--line);border-left:3px solid var(--rose);border-radius:6px;font-size:15px}
.fd .authors{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:36px 0}
.fd .author{display:flex;gap:16px;border:1px solid var(--line);border-radius:8px;padding:18px;background:#fff}
.fd .author img{width:72px;height:72px;border-radius:50%;object-fit:cover;flex:none}
.fd .author h3{margin:0 0 2px;font-size:18px;color:var(--plum)}
.fd .author .role{font-size:13px;color:var(--rose);font-weight:700;margin:0 0 8px}
.fd .author p{font-size:14px;line-height:1.6;margin:0;color:var(--ink)}
.fd .list{display:grid;gap:14px;margin:12px 0 56px}
.fd .card{display:block;border:1px solid var(--line);border-radius:8px;padding:20px 22px;background:#fff;color:inherit;text-decoration:none}
.fd .card:hover{border-color:var(--rose)}
.fd .card h3{margin:0 0 6px;font-size:21px;line-height:1.35;color:var(--plum)}
.fd .card p{margin:0 0 10px;font-size:15px;line-height:1.6;color:var(--muted)}
.fd .card small{font-size:13px;color:var(--muted)}
.fd .sec{font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--rose);margin:40px 0 8px}
.fd .bio{margin:8px 0 40px}
.fd .cta{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 64px}
.fd .btn{display:inline-block;padding:12px 18px;border-radius:8px;border:1px solid var(--plum);color:var(--plum);text-decoration:none;font-weight:700;font-size:15px}
.fd .btn.p{background:var(--plum);color:#fff}
.fd .disc{font-size:13px;color:var(--muted);border-top:1px solid var(--line);padding:16px 0 48px}
.fd .pfs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0 8px}
.fd .pfst{border:1px solid var(--line);border-radius:8px;padding:16px;background:#fff}
.fd .pfst b{display:block;font-size:26px;line-height:1.2;color:var(--plum);font-variant-numeric:tabular-nums}
.fd .pfst span{display:block;font-size:13px;line-height:1.45;color:var(--muted);margin-top:4px}
.fd .pfh{display:flex;gap:28px;align-items:center}
.fd .pfh img{width:150px;height:150px;border-radius:50%;object-fit:cover;flex:none}
.fd .pfe{border:1px solid var(--rose);border-radius:8px;padding:22px;margin:8px 0 40px;background:#fff}
.fd .pfe h3{margin:6px 0 8px;font-size:22px;line-height:1.35;color:var(--plum)}
.fd .pfe p{margin:0 0 14px;font-size:15px;line-height:1.6;color:var(--muted)}
.fd .author h3 a{color:inherit;text-decoration:none}
.fd .pfm{display:inline-block;margin-top:8px;font-size:14px;color:var(--rose);font-weight:700}
@media(max-width:700px){.fd .pfs{grid-template-columns:1fr 1fr}.fd .pfh{flex-direction:column;align-items:flex-start}.fd .pfh img{width:110px;height:110px}.fd .wrap{padding-left:16px;padding-right:16px}.fd h1{font-size:30px}.fd .body{font-size:16px}.fd .authors{grid-template-columns:1fr}}
`;

function authorCard(a, lang) {
  const href = a.profile ? `${BASE[lang]}${a.profile}.html` : "";
  const name = href ? `<a href="${href}">${esc(a.name)}</a>` : esc(a.name);
  const more = href ? `<a class="pfm" href="${href}">${esc(T[lang].profile)} →</a>` : "";
  return `<div class="author"><img src="${a.photo}" alt="${esc(a.name)}" width="72" height="72" loading="lazy"><div><h3>${name}</h3><p class="role">${esc(a[lang].role)}</p><p>${esc(a[lang].bio)}</p>${more}</div></div>`;
}

// Khối ebook: chỉ hiện khi founders-src/_ebook.json có bản của ngôn ngữ đó
function ebookBlock(ebook, lang) {
  const e = ebook?.[lang];
  if (!e) return "";
  return `<div class="pfe"><span class="eyebrow" style="color:var(--rose)">${esc(T[lang].ebookEyebrow)}</span><h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p><a class="btn p" href="${e.file}" download>${esc(T[lang].ebookCta)}</a></div>`;
}

function ctaBlock(lang) {
  const t = T[lang];
  const inv = lang === "vi" ? "/investor/" : lang === "en" ? "/investor/" : "/investor/";
  return `<div class="cta"><a class="btn p" href="mailto:contact@ikihealing.com?subject=HOPE%20CORP%20-%20Founders">${esc(t.contact)}</a><a class="btn" href="${inv}">${esc(t.invest)}</a></div>`;
}

function main() {
  const authors = JSON.parse(fs.readFileSync(path.join(SRC, "_authors.json"), "utf8"));
  const docJson = (f) => fs.existsSync(path.join(SRC, f)) ? JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8")) : null;
  const ebook = docJson("_ebook.json");
  const profiles = fs.readdirSync(SRC).filter((f) => f.startsWith("_profile-") && f.endsWith(".json")).map((f) => ({ key: f.slice(9, -5), ...docJson(f) }));
  for (const pr of profiles) if (authors[pr.key]) authors[pr.key].profile = pr.slug;
  const posts = fs.readdirSync(SRC).filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8")))
    .filter((p) => p.status !== "draft")
    .sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));

  // Cổng từ cấm trước khi ghi bất cứ thứ gì
  const loi = [];
  for (const p of posts) for (const l of LANGS) {
    if (!p[l]?.title || !p[l]?.body) loi.push(`${p.slug}: thiếu bản ${l}`);
    const txt = `${p[l]?.title}\n${p[l]?.desc}\n${p[l]?.body}`;
    for (const re of CAM[l]) { const m = txt.match(re); if (m) loi.push(`${p.slug} [${l}]: dính "${m[0]}"`); }
  }
  for (const pr of profiles) for (const l of LANGS) {
    if (!pr[l]?.title || !pr[l]?.body) loi.push(`hồ sơ ${pr.key}: thiếu bản ${l}`);
    const txt = `${pr[l]?.title}\n${pr[l]?.desc}\n${pr[l]?.body}\n${(pr[l]?.stats || []).map((x) => x.n + " " + x.l).join("\n")}`;
    for (const re of CAM[l]) { const m = txt.match(re); if (m) loi.push(`hồ sơ ${pr.key} [${l}]: dính "${m[0]}"`); }
  }
  if (loi.length) { console.error("DỪNG — không ghi file:\n" + loi.join("\n")); process.exit(1); }

  const urls = [];
  for (const lang of LANGS) {
    const t = T[lang];
    const dir = path.join(ROOT, BASE[lang].slice(1));
    fs.mkdirSync(dir, { recursive: true });

    for (const p of posts) {
      const a = authors[p.author];
      const c = p[lang];
      const alt = Object.fromEntries(LANGS.map((l) => [l, `${BASE[l]}${p.slug}.html`]));
      const others = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
      const main = `<article class="fd"><div class="wrap">
<header class="nh"><span class="eyebrow" style="color:var(--rose)">${esc(c.eyebrow || t.eyebrow)}</span><h1>${esc(c.title)}</h1><p class="lead">${esc(c.desc)}</p><p class="meta"><img src="${a.photo}" alt="" width="36" height="36"><span><strong>${esc(a.name)}</strong> · ${esc(a[lang].role)}</span><span>· ${p.date.split("-").reverse().join("/")}</span><span>· ${minutes(lang, c.body)} ${esc(t.min)}</span></p></header>
<div class="body">${md(c.body)}</div>
<p class="sec">${esc(t.by).toUpperCase()}</p><div class="bio">${authorCard(a, lang)}</div>
${others.length ? `<p class="sec">${esc(t.posts).toUpperCase()}</p><div class="list">${others.map((o) => `<a class="card" href="${BASE[lang]}${o.slug}.html"><h3>${esc(o[lang].title)}</h3><p>${esc(o[lang].desc)}</p><small>${esc(authors[o.author].name)}</small></a>`).join("")}</div>` : ""}
${ctaBlock(lang)}
<p><a href="${BASE[lang]}" style="color:var(--rose)">← ${esc(t.back)}</a></p>
<p class="disc">${esc(t.note)}</p>
</div></article>`;
      const ld = { "@context": "https://schema.org", "@type": "Article", headline: c.title, description: c.desc, inLanguage: lang, datePublished: p.date, dateModified: p.updated || p.date, author: { "@type": "Person", name: a.name, jobTitle: a.en.role, worksFor: { "@type": "Organization", name: "HOPE SERVICE CORPORATION (HOPE CORP)" } }, publisher: { "@type": "Organization", name: "IKI Beauty & Wellness", logo: { "@type": "ImageObject", url: `${SITE}/assets/brand/20260914/iki-avatar-hong-1024.png` } }, image: `${SITE}${a.photo}`, mainEntityOfPage: `${SITE}${alt[lang]}` };
      fs.writeFileSync(path.join(dir, `${p.slug}.html`), shell(lang, { title: `${c.title} | Founders HOPE CORP`, desc: c.desc, altPaths: alt, ogImage: a.photo, ld, main }));
      urls.push(`${SITE}${alt[lang]}`);
    }

    // Trang hồ sơ nhà sáng lập
    for (const pr of profiles) {
      const a = authors[pr.key];
      const c = pr[lang];
      const alt = Object.fromEntries(LANGS.map((l) => [l, `${BASE[l]}${pr.slug}.html`]));
      const ps = posts.filter((p) => p.author === pr.key);
      const main = `<article class="fd"><div class="wrap">
<header class="nh"><div class="pfh"><img src="${a.photo}" alt="${esc(a.name)}" width="150" height="150"><div><span class="eyebrow" style="color:var(--rose)">${esc(c.eyebrow || t.eyebrow)}</span><h1>${esc(c.title)}</h1><p class="lead"><strong>${esc(a.name)}</strong> · ${esc(a[lang].role)}</p></div></div>
${c.stats?.length ? `<div class="pfs">${c.stats.map((x) => `<div class="pfst"><b>${esc(x.n)}</b><span>${esc(x.l)}</span></div>`).join("")}</div>` : ""}</header>
<div class="body">${md(c.body)}</div>
${ebookBlock(ebook, lang)}
${ps.length ? `<p class="sec">${esc(t.posts).toUpperCase()}</p><div class="list">${ps.map((p) => `<a class="card" href="${BASE[lang]}${p.slug}.html"><h3>${esc(p[lang].title)}</h3><p>${esc(p[lang].desc)}</p><small>${p.date.split("-").reverse().join("/")} · ${minutes(lang, p[lang].body)} ${esc(t.min)}</small></a>`).join("")}</div>` : ""}
${ctaBlock(lang)}
<p><a href="${BASE[lang]}" style="color:var(--rose)">← ${esc(t.back)}</a></p>
<p class="disc">${esc(t.note)}</p>
</div></article>`;
      const ld = { "@context": "https://schema.org", "@type": "ProfilePage", inLanguage: lang, url: `${SITE}${alt[lang]}`, mainEntity: { "@type": "Person", name: a.name, jobTitle: a.en.role, description: c.desc, image: `${SITE}${a.photo}`, alumniOf: { "@type": "CollegeOrUniversity", name: "Sojo University" }, worksFor: { "@type": "Organization", name: "HOPE SERVICE CORPORATION (HOPE CORP)", url: SITE }, email: "contact@ikihealing.com" } };
      fs.writeFileSync(path.join(dir, `${pr.slug}.html`), shell(lang, { title: `${a.name} — ${c.title}`, desc: c.desc, altPaths: alt, ogImage: a.photo, ld, main }));
      urls.push(`${SITE}${alt[lang]}`);
    }

    // Trang chuyên mục
    const alt = Object.fromEntries(LANGS.map((l) => [l, BASE[l]]));
    const byAuthor = (k) => posts.filter((p) => p.author === k);
    const col = (k) => { const ps = byAuthor(k); const a = authors[k]; return `<p class="sec">${esc(a.name).toUpperCase()}</p>${ps.length ? `<div class="list">${ps.map((p) => `<a class="card" href="${BASE[lang]}${p.slug}.html"><h3>${esc(p[lang].title)}</h3><p>${esc(p[lang].desc)}</p><small>${p.date.split("-").reverse().join("/")} · ${minutes(lang, p[lang].body)} ${esc(t.min)}</small></a>`).join("")}</div>` : `<p class="lead" style="margin:0 0 40px">${esc(t.soon)}</p>`}`; };
    const hubMain = `<article class="fd"><div class="wrap">
<header class="nh"><span class="eyebrow" style="color:var(--rose)">${esc(t.eyebrow)}</span><h1>${esc(t.hub)}</h1><p class="lead">${esc(t.intro)}</p></header>
<div class="authors">${Object.keys(authors).map((k) => authorCard(authors[k], lang)).join("")}</div>
${ebookBlock(ebook, lang)}
${Object.keys(authors).map(col).join("\n")}
${ctaBlock(lang)}
<p class="disc">${esc(t.note)}</p>
</div></article>`;
    const ld = { "@context": "https://schema.org", "@type": "Blog", name: t.hub, description: t.hubDesc, inLanguage: lang, url: `${SITE}${alt[lang]}`, publisher: { "@type": "Organization", name: "HOPE SERVICE CORPORATION (HOPE CORP)" }, author: Object.values(authors).map((a) => ({ "@type": "Person", name: a.name, jobTitle: a.en.role })) };
    fs.writeFileSync(path.join(dir, "index.html"), shell(lang, { title: t.hub, desc: t.hubDesc, altPaths: alt, ogImage: authors.hung.photo, ld, main: hubMain }));
    urls.push(`${SITE}${alt[lang]}`);
  }

  // Sitemap: vùng riêng, thay trọn mỗi lần chạy
  const smPath = path.join(ROOT, "sitemap.xml");
  let sm = fs.readFileSync(smPath, "utf8").replace(/\n?<!-- founders:start -->[\s\S]*?<!-- founders:end -->/, "");
  const today = new Date().toISOString().slice(0, 10);
  const block = `\n<!-- founders:start -->\n${urls.map((u) => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n<!-- founders:end -->`;
  sm = sm.replace(/<\/urlset>\s*$/, `${block}\n</urlset>\n`);
  fs.writeFileSync(smPath, sm);

  console.log(`OK — ${posts.length} bài × 3 thứ tiếng, ${urls.length} trang; sitemap đã cập nhật.`);
}

main();
