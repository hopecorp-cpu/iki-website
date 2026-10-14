#!/usr/bin/env node
/**
 * dich-trang-tinh.mjs — DỊCH TRANG TĨNH Ở GỐC REPO SANG EN / JA, CHẠY LẠI ĐƯỢC.
 *
 * Vì sao có (13/10/2026, CEO: "rà soát hệ thống khi ấn chuyển đổi ngôn ngữ thì nội dung các trang
 * đều cần đc chuyển đổi đầy đủ đồng nhất, cả phần tiếng Nhật nữa"): en/ và ja/ mới có 8 trang, còn
 * 10 trang pháp lý + 404 + san-pham chưa có bản dịch nào. Khách bấm cờ EN trên trang chính sách thì
 * bị ném về trang chủ tiếng Anh — mất chỗ đang đọc, và bản tiếng Anh của chính sách thì không tồn tại.
 *
 * Máy dịch blog và máy dịch shop không dùng lại được: blog chỉ có khối <main> chữ, shop có mảng
 * PRODUCTS + JS riêng. Nhóm trang này là HTML tĩnh một khối, chữ nằm rải cả ở <head> (title,
 * description, og:*, twitter:*) lẫn thân trang, và có đường dẫn TƯƠNG ĐỐI (styles.css, script.js,
 * index.html) — bỏ vào thư mục /en/ là gãy nếu không vá.
 *
 * Cách làm, mỗi bước kèm cách kiểm:
 *   1. CHE <style> / <script> / chú thích -> mô hình không nhìn thấy mã, không sửa được mã.
 *   2. Dịch nguyên khối HTML đã che.
 *   3. ĐỐI CHIẾU: số thẻ phải y hệt; tập id/class/data-* / href / src / name / type / value / for phải y hệt.
 *      Lệch = mô hình đã nuốt markup -> KHÔNG GHI, exit 1.
 *   4. Cổng TỪ CẤM chạy trên BẢN DỊCH (thực phẩm bổ sung): bản Việt sạch không có nghĩa bản Anh sạch.
 *   5. Vá sau dịch: lang, data-lang, canonical/og:url sang /<ngon>/, og:locale, hreflang 4 dòng,
 *      đường dẫn tương đối, và BỘ CHUYỂN NGÔN NGỮ trỏ đúng TRANG hiện tại (không ném về trang chủ).
 *   6. Trang pháp lý được chèn thêm một dòng: bản tiếng Việt là bản gốc có hiệu lực.
 *
 * Tên riêng tiếng Việt (tên công ty, địa chỉ trụ sở, tên luật, tên sản phẩm) GIỮ NGUYÊN — dịch địa
 * chỉ ra tiếng Anh là làm hỏng thứ khách cần để khiếu nại hoặc gửi thư.
 *
 * Chạy (cần ANTHROPIC_API_KEY trong env, .env.local của repo này, hoặc của hope-ops-hub):
 *   node scripts/dich-trang-tinh.mjs --ngon=en chinh-sach.html
 *   node scripts/dich-trang-tinh.mjs --ngon=ja --thu chinh-sach.html     (dịch + kiểm, không ghi)
 *   node scripts/dich-trang-tinh.mjs --ngon=en --nhom=phapli             (cả 10 trang pháp lý)
 * Sửa chữ ở bản tiếng Việt thì chạy lại — bản EN/JA là file máy sinh, đừng sửa tay.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ikihealing.com";
const arg = (t, md) => { const a = process.argv.find((x) => x.startsWith(`--${t}=`)); return a ? a.split("=").slice(1).join("=") : md; };
const NGON = arg("ngon", "en");
const NHOM = arg("nhom", "");
const THU = process.argv.includes("--thu");
if (!["en", "ja"].includes(NGON)) { console.error("--ngon chỉ nhận en hoặc ja"); process.exit(1); }
const TEN_NGON = { en: "English", ja: "Japanese (日本語)" }[NGON];
const OG_LOCALE = { en: "en_US", ja: "ja_JP" }[NGON];
const NHAN_KHACH = { en: "khách EN", ja: "khách JA" }[NGON];

const NHOM_PHAPLI = [
  "chinh-sach.html", "dieu-khoan-su-dung.html", "chinh-sach-bao-mat.html", "chinh-sach-gia.html",
  "chinh-sach-thanh-toan.html", "chinh-sach-giao-hang.html", "chinh-sach-doi-tra.html",
  "giai-quyet-khieu-nai.html", "du-lieu-su-dung.html", "quyen-du-lieu.html",
];
const LA_PHAPLI = new Set(NHOM_PHAPLI);

const DS = NHOM === "phapli" ? NHOM_PHAPLI : process.argv.slice(2).filter((x) => x.endsWith(".html") && !x.startsWith("--"));
if (!DS.length) { console.error("Chưa chỉ trang nào. Ví dụ: --ngon=en chinh-sach.html   hoặc   --ngon=en --nhom=phapli"); process.exit(1); }

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
const boRao = (s) => s.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();

/* ---------- Cổng từ cấm trên bản dịch (chép từ dich-shop.mjs) ---------- */
const LUON_CAM = {
  en: [/\bcure[sd]?\b/i, /\bcuring\b/i, /\bdetox(?:ify|ification|ifying)\b/i, /\bcleanses?\b/i, /\bmiracle\b/i],
  ja: [/完治/, /解毒/, /デトックス/],
};
const CAN_BENH = {
  en: [/\btreats?\b/i, /\btreatment\b/i, /\bheals?\b/i, /\bdiagnos\w*/i],
  ja: [/治療/, /治[すしせさ]/, /診断/],
};
const TEN_RIENG_CAM = [/IKI\s*Detox/gi, /7\s*(?:Ngày|Ngay|-?Day)\s*Detox/gi, /7日間デトックス/g];
const PHU_DINH = /\b(not|never|no|cannot|can't|don'?t|does not|doesn'?t|isn'?t|is not|aren'?t|avoid|instead of|substitute|replacement|rather than)\b|ではあり|ではない|代わ|しません|ません|ではなく/i;
function soiTuCam(text) {
  let t = text; for (const re of TEN_RIENG_CAM) t = t.replace(re, " ");
  const loi = [];
  for (const re of LUON_CAM[NGON]) {
    const m = re.exec(t);
    if (m) loi.push(`${re} tại: ${JSON.stringify(t.slice(Math.max(0, m.index - 70), m.index + 60).replace(/\s+/g, " "))}`);
  }
  for (const cau of t.split(/(?<=[.!?])\s+|(?<=。)|\n/)) {
    if (PHU_DINH.test(cau)) continue;
    for (const re of CAN_BENH[NGON]) if (re.test(cau)) loi.push(`${re} trong câu: ${JSON.stringify(cau.trim().slice(0, 120))}`);
  }
  return loi;
}

/* ---------- Tên riêng được phép còn tiếng Việt sau khi dịch ---------- */
const TEN_RIENG = /CÔNG TY CỔ PHẦN TMDV HOPE|Công ty Cổ phần TMDV HOPE|Quang Trung|Hải Dương|Hải Phòng|Việt Nam|Tuệ Minh|Thanh Hương|Đồng Văn|Hà Giang|Học Viện|Cộng đồng|Sản phẩm|Ứng dụng|Trang chủ|Về HOPE CORP|Nghị định|Thông tư|Luật|Bộ Công Thương|Sở Tài chính|Phòng Đăng ký kinh doanh|Zalo|Tiếng Việt|IKI|HOPE|đ\b|₫/g;

/**
 * Phân biệt CÂU tiếng Việt còn sót (lỗi thật, phải chặn) với TÊN RIÊNG tiếng Việt nằm trong câu
 * tiếng Anh (đúng, phải giữ: địa chỉ trụ sở, tên người, tên luật). Đếm chữ ngữ pháp tiếng Việt —
 * tên riêng gần như không bao giờ có hai chữ "của/là/và/được..." trong cùng một chuỗi.
 */
const CHU_NGU_PHAP = /(?:^|[\s(,;:"'])(là|của|và|các|những|được|cho|với|trong|không|khi|đã|sẽ|này|thì|hoặc|theo|về|tại|bạn|chúng tôi|quý khách|phải|nếu|mà|từ|sau|trước|trên|dưới|đến|để|bởi|như|cũng|còn|nhưng)(?=[\s.,;:!?)"']|$)/giu;
function soiConTiengViet(html) {
  const chuoi = (html.match(/[^<>"']*[À-ÖØ-öø-ỹ][^<>"']*/g) || [])
    .map((x) => x.trim()).filter((x) => x && /[À-ÖØ-öø-ỹ]/.test(x.replace(TEN_RIENG, "")));
  const chan = [], ra = [];
  for (const x of new Set(chuoi)) {
    const dem = (x.match(CHU_NGU_PHAP) || []).length;
    (dem >= 2 ? chan : ra).push(x);
  }
  return { chan, ra };
}

const demThe = (s) => (s.match(/<[a-zA-Z][^>]*>/g) || []).length;
// Dấu vết cấu trúc: so CẢ TÊN LẪN GIÁ TRỊ cho thuộc tính cấu trúc, nhưng data-* chỉ so TÊN —
// có data-* là chữ hiển thị cho khách (data-welcome-message của widget chat), dịch nó là ĐÚNG.
const dauVet = (s) => [
  ...(s.match(/\b(?:id|class|href|src|name|type|value|for)="[^"]*"/g) || []),
  ...(s.match(/\bdata-[a-z-]+=/g) || []),
].sort().join("\n");

const RAO = `You are translating a page of ikihealing.com, the website of IKI (brand of CÔNG TY CỔ PHẦN TMDV HOPE / HOPE SERVICE CORPORATION, Hải Phòng, Vietnam). Target language: ${TEN_NGON}.

REGISTER: these are consumer-facing legal and policy pages. Use plain, precise, non-chatty ${TEN_NGON} of the kind used in real terms-of-service and privacy pages. Do not add warmth, marketing adjectives, or sentences that are not in the source. Do not drop sentences either: every obligation, deadline, number, percentage and exception must survive.

KEEP IN VIETNAMESE, exactly as written (do not translate, do not transliterate):
- the company name "CÔNG TY CỔ PHẦN TMDV HOPE" and "Công ty Cổ phần TMDV HOPE" (you may add the registered English name HOPE SERVICE CORPORATION in parentheses the first time it appears on the page, if the source already mentions it);
- the registered address and all place names (Số 40A Quang Trung, phường Hải Dương, thành phố Hải Phòng, Việt Nam);
- names of Vietnamese laws and decrees — write them as in the source and add a short English gloss in parentheses the first time, e.g. "Luật Thương mại điện tử 2025 (Vietnam's 2025 E-Commerce Law)";
- names of Vietnamese authorities (Bộ Công Thương, Sở Tài chính, Phòng Đăng ký kinh doanh) with a gloss the first time;
- brand, product and programme proper names (IKI, IKI Healing, HOPE CORP, Tuệ Minh, Thanh Hương, True Vegan Protein Pro). The course names "3 Ngày Reset" and "7 Ngày Detox" are programme names: keep them written exactly like that, do not translate them into "3-Day Reset" or "7-Day Detox". HARD RULE for these two names: the words detox / detoxify / detoxification / detoxifying / cleanse / デトックス / 解毒 must NEVER appear anywhere except inside the fixed string "7 Ngày Detox" itself. The source already states that "Detox" is only the name of the programme — translate that statement faithfully and never write that the programme removes, flushes or cleanses anything from the body;
- phone numbers, email addresses, tax code, business registration number, bank details, Zalo links;
- the value="" of every hidden form input (_subject, _next, _cc, _template, _captcha) and every radio/checkbox value: leave them byte-for-byte as in the source, Vietnamese included. They are machine fields read by the sales inbox, not text for the reader.

MONEY AND DATES: prices stay in Vietnamese đồng with the ₫ or "đ" sign and the same digits. Dates stay in the same day/month/year order as the source.

COMPLIANCE (Vietnamese food-supplement law — this is a hard constraint): IKI products are food supplements, not medicine. Never write cure / treat / heal / detox / cleanse / diagnose, never a disease claim, never "results in X days". Where the source has a disclaimer ("không phải là thuốc, không thay thế thuốc chữa bệnh"), translate it faithfully and keep it in the same place. Promotions are gifts, never a percentage discount.

GLOSSARY (${NGON === "ja" ? "Japanese" : "English"}), fixed wording — the Vietnamese source deliberately avoids medical words and the translation must too:
${NGON === "ja"
  ? `- "bài đọc thể trạng (quiz)" / "quiz thể chất" -> 体質チェック（クイズ）. NEVER write 診断 anywhere on the page: 診断 means a medical diagnosis and IKI does not diagnose. Its result is チェック結果, not 診断結果.
- "dữ liệu sức khoẻ tự khai" -> ご自身で申告いただく健康に関する情報.
- "thực phẩm bổ sung" -> 健康補助食品 (never 医薬品, never サプリで治す).`
  : `- "bài đọc thể trạng (quiz)" / "quiz thể chất" -> "body-constitution quiz". Never "diagnosis" or "assessment of a condition": IKI does not diagnose. Its output is a "quiz result".
- "dữ liệu sức khoẻ tự khai" -> "self-reported health information".
- "thực phẩm bổ sung" -> "food supplement" (never "supplement that treats", never "medicine").`}

Tone: clear and respectful, second person. ${NGON === "ja" ? "Use です・ます体 throughout. Use 当社 for the company and お客様 for the customer." : "Use British-neutral spelling and the second person (\"you\")."}`;

/**
 * Chữ CỐ ĐỊNH, dịch một lần ở đây thay vì để mô hình đoán lại mỗi lượt.
 * Lý do: lời chào của widget chat nằm trong thuộc tính data-welcome-message, có lượt mô hình dịch,
 * có lượt bỏ qua — cùng một trang chạy hai lần ra hai kết quả, và cổng kiểm thì chặn ngẫu nhiên.
 * Che trước khi đưa cho mô hình, thay lại sau khi dịch: một nguồn, chạy lại ra y hệt.
 */
const CHU_CO_DINH = [
  { vi: "Chào bạn, IKI có thể hỗ trợ gì cho bạn?", en: "Hello, how can IKI help you?", ja: "こんにちは。IKIがお手伝いできることはありますか。" },
  // Tên Học Viện: lấy đúng chữ đã duyệt trong chân trang chuẩn (scripts/sync-footer.py COPY[1]),
  // nếu không menu ghi "Academy" mà thân bài ghi "Học Viện" — lệch ngay trong một trang.
  { vi: "Học Viện IKI", en: "IKI Academy", ja: "IKIアカデミー" },
  { vi: "Học Viện", en: "IKI Academy", ja: "IKIアカデミー" },
];

async function dichMot(ten, nhac = () => {}) {
  let src = fs.readFileSync(path.join(ROOT, ten), "utf8");
  CHU_CO_DINH.forEach((c, k) => { src = src.split(c.vi).join(`@@CD${k}@@`); });
  const che = [];
  const masked = src.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<!--[\s\S]*?-->/g, (m) => { che.push(m); return `@@CHE${che.length - 1}@@`; });

  const out = boRao(await goiClaude(
    RAO + `\n\nTASK: translate every user-visible Vietnamese string in this HTML page into ${TEN_NGON}: all text nodes, <title>, the content of meta description / og:title / og:description / twitter:title / twitter:description, and the attributes placeholder / alt / aria-label / title.
Do NOT change any tag, attribute name, id, class, data-*, href, src, HTML entity, or the @@CHEn@@ placeholders; do not add, remove or reorder elements. Keep the " · IKI Healing" and " — IKI" suffixes in the title and og:title. Return ONLY the HTML, no fences, no commentary.`,
    // Hạn chữ trả về: tiếng Nhật tốn token gấp bội tiếng Việt, trang chính sách bảo mật từng bị
    // cắt cụt giữa chừng ở mức 32k (mất 66 thẻ, cổng kiểm chặn đúng). Nới theo độ dài trang.
    masked, Math.min(64000, Math.max(32000, masked.length))));

  const loi = [];
  if (demThe(out) !== demThe(masked)) loi.push(`số thẻ lệch: gốc ${demThe(masked)} / dịch ${demThe(out)}`);
  if (dauVet(out) !== dauVet(masked)) {
    const a = dauVet(masked).split("\n"), b = dauVet(out).split("\n");
    const mat = a.filter((x) => !b.includes(x)), them = b.filter((x) => !a.includes(x));
    loi.push("tập id/class/data-*/href/src lệch | mất: " + mat.slice(0, 6).join(" ") + " | thêm: " + them.slice(0, 6).join(" "));
  }
  const { chan, ra } = soiConTiengViet(out);
  if (chan.length) loi.push(`còn ${chan.length} câu tiếng Việt chưa dịch: ` + chan.slice(0, 4).map((s) => JSON.stringify(s.trim().slice(0, 80))).join(", "));
  for (const x of ra.slice(0, 8)) nhac(JSON.stringify(x.trim().slice(0, 90)));
  const cam = soiTuCam(out); if (cam.length) loi.push("từ cấm: " + cam.join(", "));
  if ((out.match(/@@CHE/g) || []).length !== che.length) loi.push("số placeholder che lệch");

  if ((out.match(/@@CD/g) || []).length !== (masked.match(/@@CD/g) || []).length) loi.push("placeholder chữ cố định bị mất");
  let t = out.replace(/@@CHE(\d+)@@/g, (_, k) => che[Number(k)]).replace(/@@CD(\d+)@@/g, (_, k) => CHU_CO_DINH[Number(k)][NGON]);
  return { html: vaSauDich(t, ten), loi };
}

/* ---------- Vá sau dịch ---------- */
function vaSauDich(t, ten) {
  // 1. ngôn ngữ của trang và của script đồng ý cookie
  t = t.replace('<html lang="vi">', `<html lang="${NGON}">`)
       .replace(/data-lang="vi"/g, `data-lang="${NGON}"`)
       .replace(/(<footer[^>]*)\slang="vi"/, `$1 lang="${NGON}"`);
  // 2. canonical + og:url + og:locale trỏ vào bản dịch
  t = t.replace(new RegExp(`(href|content)="${SITE}/${ten}"`, "g"), `$1="${SITE}/${NGON}/${ten}"`)
       .replace('content="vi_VN"', `content="${OG_LOCALE}"`);
  // 3. hreflang: khai cả ba bản + x-default trỏ bản Việt (thị trường chính)
  const hreflang = ["vi", "en", "ja"].map((l) =>
    `  <link rel="alternate" hreflang="${l}" href="${SITE}/${l === "vi" ? "" : l + "/"}${ten}" />`).join("\n")
    + `\n  <link rel="alternate" hreflang="x-default" href="${SITE}/${ten}" />`;
  if (/rel="alternate"/.test(t)) t = t.replace(/\n\s*<link rel="alternate"[^>]*>/g, "").replace(/(<link rel="canonical"[^>]*>)/, `$1\n${hreflang}`);
  else t = t.replace(/(<link rel="canonical"[^>]*>)/, `$1\n${hreflang}`);
  // 4. đường dẫn TƯƠNG ĐỐI: thứ nào không có bản dịch cùng thư mục thì phải tuyệt đối về gốc,
  //    nếu không /en/styles.css sẽ 404 và trang mất sạch giao diện.
  t = t.replace(/\b(href|src)="([a-z0-9][a-z0-9._-]*\.(?:css|js|png|jpg|jpeg|svg|webp))"/gi, '$1="/$2"');
  t = t.replace(/\bhref="([a-z0-9][a-z0-9-]*\.html)"/gi, (m, f) =>
    (fs.existsSync(path.join(ROOT, NGON, f)) || DS.includes(f)) ? m : `href="/${f}"`);
  // 4b. Biểu mẫu FormSubmit: tiêu đề thư ĐI TỚI SALE giữ tiếng Việt (sale đọc tiếng Việt) nhưng
  //     gắn nhãn ngôn ngữ của khách, để người nhận biết phải trả lời bằng thứ tiếng nào. Và _next
  //     phải về bản dịch — không thì khách gửi xong bị ném sang trang tiếng Việt.
  t = t.replace(/(name="_subject" value=")([^"]*)(")/, (m, a, v, b) => `${a}${v} (${NHAN_KHACH})${b}`)
       .replace(`name="_next" value="${SITE}/${ten}`, `name="_next" value="${SITE}/${NGON}/${ten}`);
  // 5. bộ chuyển ngôn ngữ KHÔNG sửa ở đây — scripts/sua-chuyen-ngon-ngu.mjs là chỗ duy nhất lo
  //    việc đó cho cả ba cây (gốc, en/, ja/), và nó biết trang nào đã có bản dịch. Chạy nó sau.
  // 6. trang pháp lý: nói rõ bản tiếng Việt là bản gốc có hiệu lực
  if (LA_PHAPLI.has(ten)) t = chenGhiChuBanGoc(t, ten);
  return t;
}

const GHI_CHU = {
  en: 'This is a translation provided for your convenience. The Vietnamese version at <a href="{VI}">ikihealing.com{PATH}</a> is the original and is the version that applies; if the two differ, the Vietnamese version prevails.',
  ja: 'このページはご参考のための翻訳です。<a href="{VI}">ikihealing.com{PATH}</a> のベトナム語版が原本であり、適用されるのはベトナム語版です。相違がある場合はベトナム語版が優先します。',
};
function chenGhiChuBanGoc(t, ten) {
  const p = `/${ten}`;
  const cau = GHI_CHU[NGON].replace("{VI}", `${SITE}${p}`).replace("{PATH}", p);
  const khoi = `<p class="locale-note" lang="${NGON}">${cau}</p>\n      `;
  return t.replace(/(<article class="policy-content">\s*)/, `$1${khoi}`);
}

/* ---------- Chạy ---------- */
// Chạy SONG SONG ít nhịp một: 10 trang nối đuôi mất ~15 phút, 3 nhịp một còn ~5 phút mà vẫn
// nhẹ tay với API. Gom chữ in ra theo từng trang rồi mới xả, để log không bị trộn.
const NHIP = 3;
(async () => {
  const ketQua = new Map();
  let i = 0;
  const chay = async () => {
    while (i < DS.length) {
      const ten = DS[i++];
      const ghiChu = [];
      if (!fs.existsSync(path.join(ROOT, ten))) { ketQua.set(ten, { ok: false, log: `[${NGON}] ${ten} ... BỎ: không có file gốc` }); continue; }
      try {
        const { html, loi } = await dichMot(ten, (d) => ghiChu.push(d));
        if (loi.length) { ketQua.set(ten, { ok: false, log: `[${NGON}] ${ten} ... KHÔNG GHI\n    - ` + loi.join("\n    - ") }); continue; }
        const canCanonical = /<link rel="canonical"/.test(html);
        const thieu = [`<html lang="${NGON}">`, ...(canCanonical ? [`${SITE}/${NGON}/${ten}`, `hreflang="x-default"`] : [])].filter((m) => !html.includes(m));
        if (thieu.length) { ketQua.set(ten, { ok: false, log: `[${NGON}] ${ten} ... KHÔNG GHI — vá sau dịch thiếu mốc: ${thieu.join(", ")}` }); continue; }
        const dest = path.join(ROOT, NGON, ten);
        if (!THU) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, html); }
        ketQua.set(ten, { ok: true, log: `[${NGON}] ${ten} ... ${THU ? "[thử] OK" : "ghi"} ${path.relative(ROOT, dest)} (${html.length} ký tự)` + ghiChu.map((d) => `\n    (rà tay) còn chữ Việt: ${d}`).join("") });
      } catch (e) { ketQua.set(ten, { ok: false, log: `[${NGON}] ${ten} ... LỖI: ${e.message}` }); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(NHIP, DS.length) }, chay));
  for (const ten of DS) console.log(ketQua.get(ten)?.log ?? `[${NGON}] ${ten} ... (không chạy)`);
  const hong = DS.filter((t) => !ketQua.get(t)?.ok);
  if (hong.length) { console.error(`\n${hong.length}/${DS.length} trang KHÔNG ghi được: ${hong.join(" ")}`); process.exit(1); }
  console.log(`\nXong ${DS.length} trang sang ${NGON}.`);
})();
