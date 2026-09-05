#!/usr/bin/env node
/**
 * dich-shop.mjs — DỊCH TRANG /shop SANG EN / JA, CHẠY LẠI ĐƯỢC.
 *
 * Vì sao có (18/08/2026, CEO: "trang /shop chưa dịch sang tiếng Nhật và tiếng Anh"): /shop là một
 * trang tự chứa (HTML tĩnh + mảng PRODUCTS + JS dựng thẻ/giỏ/thanh toán) nên máy dịch blog không
 * dùng lại được — bài blog chỉ có khối <main> chữ, còn shop có chữ nằm ở BA chỗ khác nhau:
 *   A. phần HTML tĩnh (thanh menu, hero, bộ lọc, FAQ, biểu mẫu đặt hàng, chân trang);
 *   B. mảng PRODUCTS (tên, mô tả, điểm nổi bật, cách dùng, bảo quản của 19 sản phẩm);
 *   C. chuỗi chữ nằm TRONG mã JS (nút "Đặt mua ngay", toast, thông báo lỗi, màn cảm ơn…).
 * Mỗi chỗ dịch theo một cách khác nhau, vì cách kiểm chứng khác nhau:
 *   A → dịch nguyên khối HTML (đã che <style>/<script>), rồi ĐỐI CHIẾU tập id/class/data-* và số thẻ
 *       phải y hệt bản gốc — thẻ nào lệch là mô hình đã nuốt markup, bỏ, không ghi.
 *   B → dịch dưới dạng JSON đúng khuôn, giữ nguyên price/img/cat/score; kèm trường `vn` (tên tiếng
 *       Việt gốc) để đơn/lead gửi về ops-hub vẫn mang tên sản phẩm mà sale đọc được.
 *   C → KHÔNG đưa mã cho mô hình. Bóc từng đoạn chữ có dấu tiếng Việt (bị chặn bởi dấu nháy, < > { }),
 *       dịch theo bảng từ điển, rồi thay ngược vào — mã giữ nguyên từng ký tự. Sau đó parse lại bằng
 *       `new Function` để chắc JS còn nguyên cú pháp.
 * Chuỗi DÀNH CHO SALE (ghi chú đơn, ghi chú xin tư vấn) GIỮ tiếng Việt, kèm nhãn "khách EN/JA".
 *
 * Cổng từ cấm chạy trên BẢN DỊCH (giống dich-blog.mjs): sản phẩm là thực phẩm bổ sung, bản Việt
 * sạch không có nghĩa bản Anh/Nhật sạch.
 *
 * Chạy (cần ANTHROPIC_API_KEY trong env hoặc .env.local của repo này / của hope-ops-hub):
 *   node scripts/dich-shop.mjs --ngon=en          -> ghi en/shop/index.html
 *   node scripts/dich-shop.mjs --ngon=ja          -> ghi ja/shop/index.html
 *   node scripts/dich-shop.mjs --ngon=en --thu    -> chỉ dịch + kiểm, không ghi
 * Sửa sản phẩm ở shop/index.html thì chạy lại — bản EN/JA là file máy sinh, đừng sửa tay.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ikihealing.com";
const arg = (t, md) => { const a = process.argv.find((x) => x.startsWith(`--${t}=`)); return a ? a.split("=").slice(1).join("=") : md; };
const NGON = arg("ngon", "en");
const THU = process.argv.includes("--thu");
if (!["en", "ja"].includes(NGON)) { console.error("--ngon chỉ nhận en hoặc ja"); process.exit(1); }
const TEN_NGON = { en: "English", ja: "Japanese (日本語)" }[NGON];
const LOCALE = { en: "en-US", ja: "ja-JP" }[NGON];
const NHAN_KHACH = { en: "khách EN", ja: "khách JA" }[NGON];

const KEY = (() => {
  const envs = [process.env.ANTHROPIC_API_KEY];
  for (const p of [path.join(ROOT, ".env.local"), path.join(process.env.HOME || "", "hope-corp", "hope-ops-hub", ".env.local")]) {
    if (!fs.existsSync(p)) continue;
    for (const l of fs.readFileSync(p, "utf8").split("\n")) {
      const m = /^ANTHROPIC_API_KEY\s*=\s*(.+)$/.exec(l.trim());
      if (m) envs.push(m[1].replace(/^["']|["']$/g, ""));
    }
  }
  return envs.find((x) => x && x.trim())?.trim();
})();
if (!KEY) { console.error("Thiếu ANTHROPIC_API_KEY (env, .env.local, hoặc ~/hope-corp/hope-ops-hub/.env.local)."); process.exit(1); }

async function goiClaude(system, user, maxTokens = 32000) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`API ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  const txt = (j?.content || []).find((c) => c?.type === "text")?.text || "";
  if (!txt.trim()) throw new Error("mô hình trả rỗng (kiểm khối thinking / max_tokens)");
  return txt.trim();
}
const boRao = (s) => s.replace(/^```(?:html|json)?\s*/i, "").replace(/```\s*$/i, "").trim();

/* ---------- Từ cấm trên bản dịch (chép từ dich-blog.mjs, rút gọn cho shop) ---------- */
const LUON_CAM = {
  en: [/\bcure[sd]?\b/i, /\bcuring\b/i, /\bdetox(?:ify|ification|ifying)\b/i, /\bcleanses?\b/i, /\bmiracle\b/i],
  ja: [/完治/, /解毒/, /デトックス/],
};
const CAN_BENH = {
  en: [/\btreats?\b/i, /\btreatment\b/i, /\bheals?\b/i, /\bdiagnos\w*/i],
  ja: [/治療/, /治[すしせさ]/, /診断/],
};
const TEN_RIENG = [/IKI\s*Detox/gi];
// Câu có phủ định / miễn trừ ("does not treat", "not intended to diagnose") thì từ nhạy cảm là hợp lệ
// — đây chính là câu rào pháp lý bắt buộc, gạt nó là gạt thứ bảo vệ mình (bài học dich-blog 17/08).
const PHU_DINH = /\b(not|never|no|cannot|can't|don'?t|does not|doesn'?t|isn'?t|is not|aren'?t|avoid|instead of|substitute|replacement|rather than)\b|ではあり|ではない|代わ|しません|ません|ではなく/i;
function soiTuCam(text) {
  let t = text; for (const re of TEN_RIENG) t = t.replace(re, " ");
  const loi = LUON_CAM[NGON].filter((re) => re.test(t)).map((re) => String(re));
  for (const cau of t.split(/(?<=[.!?])\s+|(?<=。)|\n/)) {
    if (PHU_DINH.test(cau)) continue;
    for (const re of CAN_BENH[NGON]) if (re.test(cau)) loi.push(`${re} trong câu: ${JSON.stringify(cau.trim().slice(0, 120))}`);
  }
  return loi;
}

const RAO = `You are translating an e-commerce page for IKI Healing (HOPE Corp, Vietnam): plant-based protein, herbal teas, cooking oils, condiments, whole foods. Target language: ${TEN_NGON}.
COMPLIANCE (food supplement, Vietnamese law): never write cure/treat/heal/detox/cleanse or disease claims; use neutral wording ("supports daily nutrition", "herbal tea for everyday drinking"). Keep the disclaimer sentences faithful ("not a medicine, does not replace medicine").
NAMES: keep brand/product proper names as-is (IKI Healing, HOPE Corp, True Vegan Protein Pro, Tuệ Minh, Thanh Hương, Homefood, Hanuti, SADHU, Mueloliva, Siri Siri SUDANTA, Eco G9, Đồng Văn, Hà Giang). Prices stay in Vietnamese đồng with the ₫ sign; ${NGON === "en" ? "use comma thousands separators (668,000₫)." : "use comma thousands separators (668,000₫) and you may add 円 nowhere — do not convert currency."}
Certification labels, translate consistently everywhere: "Thuần chay"→${NGON === "en" ? "Vegan" : "ヴィーガン"}, "Hữu cơ"→${NGON === "en" ? "Organic" : "オーガニック"}, "Nguyên chất"→${NGON === "en" ? "Pure" : "純正"}, "Nguyên liệu lành"→${NGON === "en" ? "Wholesome ingredients" : "やさしい原料"}.
"COD" stays "COD". Tone: warm, concise, natural ${TEN_NGON} for online shoppers.`;

/* ---------- Đọc và cắt file gốc ---------- */
const SRC_PATH = path.join(ROOT, "shop", "index.html");
const src = fs.readFileSync(SRC_PATH, "utf8");
const iLib = src.indexOf('<script data-lib="qrcode-generator-inlined">');
const iProd = src.indexOf("<script>const PRODUCTS=");
const jProd = src.indexOf("</script>", iProd) + "</script>".length;
if (iLib < 0 || iProd < 0) { console.error("Không tìm thấy mốc cắt (qrcode lib / PRODUCTS) trong shop/index.html"); process.exit(1); }
const A = src.slice(0, iLib);          // HTML tĩnh + CSS
const LIB = src.slice(iLib, iProd);    // thư viện QR, không đụng
const PROD = src.slice(iProd, jProd);  // <script>const PRODUCTS=[...];</script>
const R = src.slice(jProd);            // JS chính + widget Zalo + kiem-form

const demThe = (s) => (s.match(/<[a-zA-Z][^>]*>/g) || []).length;
const dauVet = (s) => (s.match(/\b(?:id|class|data-[a-z-]+|href|src|name|type|value|for)="[^"]*"/g) || []).sort().join("\n");

/* ---------- A. HTML tĩnh ---------- */
async function dichHtml() {
  const che = [];
  const masked = A.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<!--[\s\S]*?-->/g, (m) => { che.push(m); return `@@CHE${che.length - 1}@@`; });
  const out = boRao(await goiClaude(
    RAO + `\nTASK: translate every user-visible Vietnamese string in this HTML fragment into ${TEN_NGON}: text nodes, <title>, and the attributes placeholder / alt / aria-label / title. Do NOT change any tag, attribute name, id, class, data-*, href, src, entity, or the @@CHEn@@ placeholders; do not add, remove or reorder elements. Keep "IKI Healing — ..." title pattern. Return ONLY the HTML, no fences, no commentary.`,
    masked, 40000));
  const loi = [];
  if (demThe(out) !== demThe(masked)) loi.push(`số thẻ lệch: gốc ${demThe(masked)} / dịch ${demThe(out)}`);
  if (dauVet(out) !== dauVet(masked)) loi.push("tập id/class/data-*/href/src lệch");
  const conVN = out.match(/[^<>"']*[À-ÖØ-öø-ỹ][^<>"']*/g) || [];
  const conVNlaz = conVN.filter((s) => !/Tuệ Minh|Thanh Hương|Đồng Văn|Hà Giang|đ\b|₫/.test(s));
  if (conVNlaz.length > 3) loi.push("còn nhiều chuỗi tiếng Việt chưa dịch: " + conVNlaz.slice(0, 5).map((s) => JSON.stringify(s.trim())).join(", "));
  const cam = soiTuCam(out); if (cam.length) loi.push("từ cấm trong HTML: " + cam.join(", "));
  const restored = out.replace(/@@CHE(\d+)@@/g, (_, k) => che[Number(k)]);
  if ((restored.match(/@@CHE/g) || []).length) loi.push("placeholder che chưa khôi phục hết");
  return { html: restored, loi };
}

/* ---------- B. PRODUCTS ---------- */
async function dichProducts() {
  const m = /^<script>const PRODUCTS=([\s\S]*);<\/script>$/.exec(PROD);
  if (!m) throw new Error("khuôn PRODUCTS lạ");
  const goc = JSON.parse(m[1]);
  const TEXT_KEYS = ["n", "t", "desc", "intro", "usage", "storage", "badge"];
  const vao = goc.map((p) => ({ n: p.n, t: p.t, desc: p.desc, intro: p.intro, highlights: p.highlights, usage: p.usage, storage: p.storage, certs: p.certs, badge: p.badge }));
  const out = boRao(await goiClaude(
    RAO + `\nTASK: translate the text values of this JSON array of products into ${TEN_NGON}. Keep the exact same array length, object order, keys and array shapes (highlights is an array of {t,d}; certs is an array of short labels — translate labels consistently: "Thuần chay"→${NGON === "en" ? '"Vegan"' : '"ヴィーガン"'}, "Hữu cơ"→${NGON === "en" ? '"Organic"' : '"オーガニック"'}, "Nguyên chất"→${NGON === "en" ? '"Pure"' : '"純正"'}, "Nguyên liệu lành"→${NGON === "en" ? '"Wholesome ingredients"' : '"やさしい原料"'}). Empty strings stay empty. Product names: translate descriptive words but keep proper names (e.g. "Bột Đạm Dinh Dưỡng TRUE VEGAN PROTEIN PRO 500G" → ${NGON === "en" ? '"TRUE VEGAN PROTEIN PRO plant protein powder 500g"' : '"TRUE VEGAN PROTEIN PRO 植物性プロテイン 500g"'}). Return ONLY valid JSON, no fences.`,
    JSON.stringify(vao), 40000));
  const dich = JSON.parse(out);
  const loi = [];
  if (!Array.isArray(dich) || dich.length !== goc.length) loi.push(`PRODUCTS: số sản phẩm lệch ${goc.length} -> ${dich?.length}`);
  const merged = goc.map((p, i) => {
    const d = dich[i] || {};
    for (const k of TEXT_KEYS) if (typeof d[k] !== "string" && p[k] !== undefined) loi.push(`sp ${i} thiếu ${k}`);
    if (!Array.isArray(d.highlights) || d.highlights.length !== (p.highlights || []).length) loi.push(`sp ${i} highlights lệch`);
    if (!Array.isArray(d.certs) || d.certs.length !== (p.certs || []).length) loi.push(`sp ${i} certs lệch`);
    const q = { ...p, vn: p.n };
    for (const k of TEXT_KEYS) if (typeof d[k] === "string") q[k] = d[k];
    if (Array.isArray(d.highlights)) q.highlights = d.highlights.map((h, j) => ({ t: String(h?.t ?? p.highlights[j].t), d: String(h?.d ?? p.highlights[j].d) }));
    if (Array.isArray(d.certs)) q.certs = d.certs.map(String);
    return q;
  });
  const cam = soiTuCam(JSON.stringify(merged)); if (cam.length) loi.push("từ cấm trong PRODUCTS: " + cam.join(", "));
  return { js: `<script>const PRODUCTS=${JSON.stringify(merged)};</script>`, loi, certs: [...new Set(merged.flatMap((p) => p.certs))] };
}

/* ---------- C. Chuỗi trong JS ---------- */
// Chuỗi dành cho SALE / hệ thống — giữ tiếng Việt, không đưa vào từ điển.
const GIU_NGUYEN = new Set(["ĐƠN /shop · ", " · CK trước", " · ĐC: ", "Xin tư vấn", " — "]);
async function dichJs() {
  const re = /[^'"`<>{}\n]*[À-ÖØ-öø-ỹ][^'"`<>{}\n]*/g;
  const spans = [...new Set((R.match(re) || []).map((s) => s))].filter((s) => !GIU_NGUYEN.has(s));
  const out = boRao(await goiClaude(
    RAO + `\nTASK: these are UI strings extracted from a web shop's JavaScript (buttons, toasts, validation messages, checkout texts, small HTML fragments inside template strings). Translate each into ${TEN_NGON}. Return ONLY a JSON array of strings, same length and order. Preserve leading/trailing spaces and punctuation exactly (they glue to code), keep HTML entities like &amp; and &nbsp;, keep placeholders/HTML tags if any. Strings that end with ": " or start with " " are fragments concatenated with variables — translate so the fragment still reads naturally when joined.`,
    JSON.stringify(spans), 16000));
  const dich = JSON.parse(out);
  const loi = [];
  if (!Array.isArray(dich) || dich.length !== spans.length) { loi.push(`từ điển JS lệch độ dài ${spans.length} -> ${dich?.length}`); return { js: R, loi }; }
  const map = new Map(spans.map((s, i) => [s, String(dich[i])]));
  // thay dài trước ngắn sau, đúng một lượt trên bản gốc để không thay chồng
  const sorted = [...map.keys()].sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let js = R.replace(new RegExp(sorted.map(esc).join("|"), "g"), (m) => map.get(m) ?? m);
  // Chuỗi cho sale: đánh dấu khách nói tiếng gì + tên sản phẩm tiếng Việt gốc để sale đọc được.
  js = js
    .replace("'ĐƠN /shop · '+p.n", `'ĐƠN /${NGON}/shop (${NHAN_KHACH}) · '+(p.vn||p.n)`)
    .replace("product: p?p.n:''", "product: p?(p.vn||p.n):''")
    .replace("note: 'Xin tư vấn'+(p?(' — '+p.n):'')", `note: 'Xin tư vấn (${NHAN_KHACH})'+(p?(' — '+(p.vn||p.n)):'')`)
    // Khối donWeb (vá 05/09/2026): đơn + ĐỊA CHỈ đi CHUNG một cửa sang PAY_CREATE, không còn
    // đường /api/leads/ingest riêng. Tên hàng phải là tên VIỆT gốc để sale đọc được đơn của khách
    // nước ngoài; `source` mang đuôi ngôn ngữ để đo được cửa nào ra đơn.
    .replace("product:p.n, qty:coQty", "product:(p.vn||p.n), qty:coQty")
    .replace("pkg:p.n+' \\u00d7 '+coQty, source:'shop'", `pkg:(p.vn||p.n)+' \\u00d7 '+coQty, source:'shop-${NGON}'`)
    .replace("source:'shop-tu-van'", `source:'shop-tu-van-${NGON}'`)
    .replace("n.toLocaleString('vi-VN')+'₫'", `n.toLocaleString('${LOCALE}')+'₫'`);
  for (const mốc of ["(p.vn||p.n)", `shop-tu-van-${NGON}`, `source:'shop-${NGON}'`, LOCALE, NHAN_KHACH]) if (!js.includes(mốc)) loi.push(`hậu xử lý JS không tìm thấy mốc: ${mốc}`);
  const giuNguyen = [...map].filter(([k, v]) => k === v).length;
  if (giuNguyen > Math.max(3, spans.length * 0.1)) loi.push(`từ điển JS: mô hình giữ nguyên ${giuNguyen}/${spans.length} chuỗi — dịch lười?`);
  // Tên riêng ĐƯỢC PHÉP giữ nguyên tiếng Việt trong bản dịch. "Đạm" thêm 05/09/2026: nó là tên
  // dòng hàng trong chú thích JS, mô hình giữ lại là đúng, nhưng cửa kiểm lại chặn cả lượt dịch.
  // Lột tên riêng KHÔNG làm lọt câu Việt còn sót — câu thật luôn còn dấu ở chữ khác.
  const TEN = /Tuệ Minh|Thanh Hương|Đồng Văn|Hà Giang|Đạm/g;
  const conVN = (js.match(re) || []).filter((s) => !GIU_NGUYEN.has(s) && !map.has(s) && !/khách (EN|JA)|Xin tư vấn|ĐƠN \//.test(s) && /[À-ÖØ-öø-ỹ]/.test(s.replace(TEN, "")));
  if (conVN.length) loi.push("JS còn chuỗi tiếng Việt: " + conVN.slice(0, 5).map((s) => JSON.stringify(s)).join(", "));
  // cú pháp: parse từng khối <script> không src
  for (const m2 of js.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    try { new Function(m2[1]); } catch (e) { loi.push("JS vỡ cú pháp sau khi dịch: " + e.message); }
  }
  const cam = soiTuCam(js.replace(/data:image[^"']+/g, "")); if (cam.length) loi.push("từ cấm trong JS: " + cam.join(", "));
  return { js, loi };
}

/* ---------- Ráp + sửa đường dẫn/hreflang ---------- */
function ghepTrang(html, prodJs, restJs) {
  let a = html;
  // đầu trang: lang + canonical (hreflang 4 dòng đã có sẵn ở bản gốc, không chèn trùng)
  a = a.replace('<html lang="vi">', `<html lang="${NGON}">`)
       .replace(`<link rel="canonical" href="${SITE}/shop/">`, `<link rel="canonical" href="${SITE}/${NGON}/shop/">`);
  // bộ chuyển ngôn ngữ: chuyển "on" sang đúng thứ tiếng
  a = a.replace(/(<a href="\/shop\/" data-lang="vi") class="on"/, "$1")
       .replace(new RegExp(`(<a href="/${NGON}/shop/" data-lang="${NGON}")`), '$1 class="on"');
  // link nội bộ sang bản cùng ngôn ngữ (chỉ đổi thứ CÓ THẬT ở en/ ja/: trang chủ, blog, quiz)
  a = a.replace(/href="https:\/\/ikihealing\.com\/"/g, `href="${SITE}/${NGON}/"`)
       .replace(/href="https:\/\/ikihealing\.com\/blog\/"/g, `href="${SITE}/${NGON}/blog/"`)
       .replace(/href="https:\/\/ikihealing\.com\/blog\/([a-z0-9-]+)\.html"/g, (m, slug) =>
         fs.existsSync(path.join(ROOT, NGON, "blog", `${slug}.html`)) ? `href="${SITE}/${NGON}/blog/${slug}.html"` : m);
  const r = restJs.replace(/href="https:\/\/ikihealing\.com\/quiz\/"/g, `href="${SITE}/${NGON}/quiz/"`);
  const out = a + LIB + prodJs + r;
  for (const moc of [`<html lang="${NGON}">`, `/${NGON}/shop/">`, `data-lang="${NGON}" class="on"`, `hreflang="x-default"`]) if (!out.includes(moc)) throw new Error(`ghép trang thiếu mốc: ${moc}`);
  return out;
}

(async () => {
  console.log(`[dich-shop] ngôn ngữ ${NGON} · A ${A.length} ký tự · PRODUCTS ${PROD.length} · JS ${R.length}`);
  const [ha, pb, jc] = await Promise.all([dichHtml(), dichProducts(), dichJs()]);
  const loi = [...ha.loi, ...pb.loi, ...jc.loi];
  // bộ lọc "Chứng nhận" ở sidebar chỉ là trang trí (không nối JS) — chỉ nhắc, không chặn
  for (const c of pb.certs) if (!ha.html.includes(c)) console.warn(`  (nhắc) nhãn certs "${c}" trong PRODUCTS không thấy trong bộ lọc HTML`);
  if (loi.length) { console.error("KHÔNG GHI — lỗi:\n  - " + loi.join("\n  - ")); process.exit(1); }
  const out = ghepTrang(ha.html, pb.js, jc.js);
  const dest = path.join(ROOT, NGON, "shop", "index.html");
  if (THU) { console.log(`[thử] OK, ${out.length} ký tự, không ghi ${dest}`); fs.writeFileSync(path.join(ROOT, `.dich-shop-${NGON}.thu.html`), out); return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  console.log(`Đã ghi ${path.relative(ROOT, dest)} (${out.length} ký tự)`);
})().catch((e) => { console.error("LỖI:", e.message); process.exit(1); });
