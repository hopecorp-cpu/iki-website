#!/usr/bin/env node
/**
 * dich-blog.mjs — DỊCH BÀI BLOG SANG EN / JA THEO LÔ, CHẠY LẠI ĐƯỢC.
 *
 * Vì sao có (việc #40): bản tiếng Việt có 323 bài, EN và JA mỗi bên 78 — lệch 245 bài mỗi thứ
 * tiếng. Dịch tay từng bài thì không bao giờ đuổi kịp vì máy viết blog vẫn đẻ bài mỗi ngày.
 *
 * CÁCH LÀM — mượn KHUNG của một bài EN/JA đã có, chỉ thay RUỘT:
 *   Bài EN/JA cũ đã đúng hết phần vỏ (thanh menu tiếng Anh/Nhật, chân trang, GTM, CSP, đường dẫn
 *   tài nguyên sâu thêm một cấp). Dịch lại cả trang là vừa tốn tiền vừa dễ vỡ thẻ. Nên máy này:
 *     1. lấy một bài EN/JA sẵn có làm KHUÔN,
 *     2. dịch ĐÚNG ba thứ của bài Việt: tiêu đề, mô tả, và khối <main>…</main>,
 *     3. đắp vào khuôn, sửa canonical + hreflang + đường dẫn ảnh hero cho đúng slug mới.
 *   Nhờ vậy mỗi bài chỉ tốn một lượt gọi mô hình cho phần chữ thật, không đụng vào mã.
 *
 * BA CHỐT AN TOÀN:
 *   - CỔNG TỪ CẤM chạy trên BẢN DỊCH trước khi ghi. Sản phẩm là thực phẩm bổ sung: bản Việt sạch
 *     không có nghĩa bản Anh sạch — "thanh lọc" dịch ẩu thành "detoxify", "hỗ trợ" thành "treats".
 *     Dính từ cấm thì BỎ bài đó, in ra, không ghi file.
 *   - ĐẾM THẺ trước và sau. Số thẻ mở/đóng của khối <main> phải khớp bản gốc, lệch là mô hình đã
 *     nuốt mất markup -> bỏ bài, không ghi.
 *   - CHẠY LẠI ĐƯỢC: bài nào đã có file đích thì bỏ qua. Hỏng giữa chừng thì chạy lại là đi tiếp.
 *
 * Chạy:
 *   node scripts/dich-blog.mjs --ngon=en --lo=5           dịch 5 bài chưa có bản EN
 *   node scripts/dich-blog.mjs --ngon=ja --lo=5
 *   node scripts/dich-blog.mjs --ngon=en --slug=an-cay-nhieu-co-hai-khong
 *   node scripts/dich-blog.mjs --ngon=en --lo=3 --thu     xem trước, KHÔNG ghi file
 *
 * Sau khi chạy: kiểm bằng mắt vài bài rồi mới `git push` (deploy = push, GitHub Pages tự dựng).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ikihealing.com";
const arg = (t, md) => { const a = process.argv.find((x) => x.startsWith(`--${t}=`)); return a ? a.split("=").slice(1).join("=") : md; };
const NGON = arg("ngon", "en");
const LO = Number(arg("lo", "5")) || 5;
const SLUG = arg("slug", "");
const THU = process.argv.includes("--thu");

if (!["en", "ja"].includes(NGON)) { console.error("--ngon chỉ nhận en hoặc ja"); process.exit(1); }

const TEN_NGON = { en: "English", ja: "Japanese (日本語)" }[NGON];

/**
 * Từ cấm — áp cho CẢ bản dịch. Bản Việt sạch không bảo đảm bản dịch sạch.
 *
 * HAI HẠNG, vì tiếng Anh dùng chung động từ cho nghĩa y học và nghĩa đời thường:
 *   - LUON_CAM: gặp là chặn. "cure", "detoxify", "cleanse" hầu như chỉ có một nghĩa.
 *   - CAN_BENH: chỉ chặn khi TRONG CÙNG CÂU có tên bệnh hoặc triệu chứng. Đo lô 25 bài tiếng Anh
 *     đầu tiên: cả 4 bài bị gạt đều oan — "wounds take a long time to heal" (vết thương lành),
 *     "treat the two as equivalent" (coi hai thứ như nhau), "don't self-diagnose". Không có tên
 *     bệnh đi kèm thì mấy chữ này là tiếng Anh bình thường, chặn trần là gạt sạch kho bài.
 * Điều BỊ CẤM thật là hứa CHỮA BỆNH — tức là động từ CỘNG một cái bệnh, nên bắt đúng cặp đó.
 */
const LUON_CAM = {
  vi: [/\bchữa\b/i, /điều trị/i, /khỏi bệnh/i, /thải độc/i, /thực phẩm chức năng/i],
  en: [/\bcure[sd]?\b/i, /\bcuring\b/i, /\bdetox(?:ify|ification|ifying)\b/i, /\bcleanses?\b/i, /\bmiracle\b/i],
  ja: [/治療/, /完治/, /解毒/],
};
const CAN_BENH = {
  vi: [/\btrị\b/i],
  en: [/\btreats?\b/i, /\btreating\b/i, /\btreatment\b/i, /\bheals?\b/i, /\bhealing\b/i, /\bremed(?:y|ies)\b/i, /\bdiagnos\w*/i],
  // 治す chia đuôi thành 治します / 治した / 治せる — bắt theo thân từ 治[すしせさ], không bắt nguyên dạng
  // từ điển (đo 17/08: câu "糖尿病を治します" lọt qua vì trong câu không hề có chữ 治す).
  ja: [/治[すしせさ]/, /診断/],
};
/** Tên bệnh và triệu chứng — có mặt trong câu thì mấy động từ ở CAN_BENH mới thành lời hứa y học. */
const TEN_BENH = /\b(disease|illness|sickness|disorder|syndrome|infection|cancer|tumou?r|diabetes|gout|arthritis|ulcer|hypertension|cholesterol|insomnia|depression|anxiety|liver|kidney|thyroid|patients?|symptoms?|condition)\b|bệnh|bệnh nhân|triệu chứng|ung thư|tiểu đường|gout|gút|viêm|loét|huyết áp|mất ngủ|病気|疾患|症状|患者|がん|糖尿病|痛風/i;

const KEY = (() => {
  const p = path.join(ROOT, ".env.local");
  const envs = [process.env.ANTHROPIC_API_KEY];
  if (fs.existsSync(p)) {
    for (const l of fs.readFileSync(p, "utf8").split("\n")) {
      const m = /^ANTHROPIC_API_KEY\s*=\s*(.+)$/.exec(l.trim());
      if (m) envs.push(m[1].replace(/^["']|["']$/g, ""));
    }
  }
  return envs.find((x) => x && x.trim())?.trim();
})();
if (!KEY) { console.error("Thiếu ANTHROPIC_API_KEY (biến môi trường hoặc .env.local)."); process.exit(1); }

/**
 * Gọi Claude. HAI BẪY ĐÃ DÍNH:
 *   - Bản mới bật chế độ nghĩ nên content[0] là khối rỗng — phải tìm đúng khối text.
 *   - Phần nghĩ ĂN VÀO max_tokens. Để 16.000 thì bài dài trả về RỖNG (đo 17/08: bài "ăn cay" hỏng
 *     đúng vì vậy trong khi 5 bài ngắn hơn cùng lô vẫn ra). Để rộng 32.000 cho chắc.
 */
async function goiClaude(system, user, maxTokens = 32000) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    // Sonnet cho việc LẶP SỐ LƯỢNG LỚN (luật chọn model của CEO): 490 lượt dịch là việc lặp, không
    // phải việc nghĩ. Opus đắt hơn ~1,7 lần cho cùng một bài dịch mà không hơn về chất ở đây.
    body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`API ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const txt = (j?.content || []).find((c) => c?.type === "text")?.text || "";
  if (!txt.trim()) throw new Error("mô hình trả rỗng (kiểm khối thinking / max_tokens)");
  return txt.trim();
}

const layKhoi = (html, mo, dong) => {
  const i = html.indexOf(mo), j = html.lastIndexOf(dong);
  return i < 0 || j < 0 ? null : { i, j: j + dong.length, noi: html.slice(i, j + dong.length) };
};
const demThe = (s) => (s.match(/<[a-zA-Z][^>]*>/g) || []).length;
const boRao = (s) => s.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();

/**
 * Câu có dấu PHỦ ĐỊNH / MIỄN TRỪ thì từ nhạy cảm trong đó là hợp lệ.
 *
 * Vì sao phải xét theo CÂU chứ không theo từ (đo 17/08/2026): 313 trên 323 bài tiếng Việt có chữ
 * "chẩn đoán" — nằm trong đúng câu miễn trừ bắt buộc "không thay thế chẩn đoán hoặc tư vấn y khoa".
 * Dịch sang Anh thành "not a substitute for medical diagnosis". Bắt trần theo từ thì gạt gần như
 * toàn bộ kho bài, mà thứ bị gạt lại chính là câu BẢO VỆ mình về mặt pháp lý. Cùng bài học với
 * "khoai tây" bị chặn vì dính "tay": từ ngắn phải xét ngữ cảnh, không xét sự có mặt.
 */
const PHU_DINH = /\b(not|never|no|cannot|can't|can not|don'?t|do not|does not|doesn'?t|didn'?t|isn'?t|is not|aren'?t|won'?t|avoid|instead of|substitute|replacement|rather than)\b|không|chẳng|đừng|thay thế|ではあり|ではない|代わ|しません|ません/i;

/**
 * TÊN RIÊNG ĐƯỢC PHÉP MANG TỪ NHẠY CẢM (luật CLAUDE.md: "IKI Detox là tên brand — được; nhưng
 * không mô tả sản phẩm có tác dụng thải độc").
 *
 * Đo lô tiếng Nhật đầu tiên 17/08: 5 trên 6 bài bị gạt oan chỉ vì chân trang có tên khoá học
 * "7 Ngày Detox" dịch thành "7日間デトックス", và nhãn bài trắc nghiệm thể tạng dịch thành "無料診断".
 * Đây là TÊN GỌI, không phải lời hứa công dụng — gạt chúng là gạt cả kho bài vì chân trang bài
 * nào cũng có. Gỡ trước rồi mới soi phần còn lại.
 */
const TEN_RIENG = [
  /(?:7[\s-]*(?:day|days|日間)|IKI)\s*(?:デトックス|[Dd]etox)/g,
  /(?:3[\s-]*(?:day|days|日間))\s*(?:リセット|[Rr]eset)/g,
  /IKI\s*Detox/gi,
];
/** Nhãn của bài trắc nghiệm thể tạng — là TÊN TÍNH NĂNG, không phải chẩn đoán y khoa. */
const NHAN_TRAC_NGHIEM = [/無料診断/g, /体質診断/g, /free\s+(?:assessment|quiz|check)/gi];

function dinhTuCam(text, ngon) {
  let plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const re of [...TEN_RIENG, ...NHAN_TRAC_NGHIEM]) plain = plain.replace(re, " ");
  // Cắt câu ở dấu chấm/hỏi/than của cả hai hệ chữ.
  const cau = plain.split(/(?<=[.!?。！？])\s+/);
  const dinh = new Set();
  for (const c of cau) {
    if (PHU_DINH.test(c)) continue;               // câu miễn trừ / câu khuyên ĐỪNG làm — bỏ qua
    for (const re of LUON_CAM[ngon] || []) if (re.test(c)) dinh.add(`${re} @ "${c.trim().slice(0, 70)}"`);
    // Động từ hai nghĩa: chỉ thành lời hứa y học khi trong câu có tên bệnh/triệu chứng.
    if (TEN_BENH.test(c)) {
      for (const re of CAN_BENH[ngon] || []) if (re.test(c)) dinh.add(`${re}+bệnh @ "${c.trim().slice(0, 70)}"`);
    }
  }
  return [...dinh];
}

// ── BÀI KIỂM CỔNG TỪ CẤM (node scripts/dich-blog.mjs --kiem) ──────────────────
//
// Bám luật CLAUDE.md "test bộ lọc bằng ĐẦU VÀO THẬT": mọi câu dưới đây LẤY TỪ bản dịch thật đã
// chạy ngày 17/08, không phải câu bịa ra cho dễ đậu. Sửa bộ lọc thì chạy lại cái này trước.
if (process.argv.includes("--kiem")) {
  const CA = [
    // [ngôn ngữ, câu, có phải VI PHẠM không]
    ["en", "An important note: don't self-diagnose a nutrient deficiency and then buy supplements.", false],
    ["en", "Getting sick often, small wounds that take a long time to heal.", false],
    ["en", "Don't treat the two as equivalent, and don't assume that eating lots of pineapple helps.", false],
    ["en", "This is not a substitute for medical diagnosis or advice.", false],
    ["en", "Try the 7-Day Detox course at IKI Academy.", false],
    ["en", "This tea cures liver disease in two weeks.", true],
    ["en", "Our supplement treats diabetes and gout.", true],
    ["en", "A daily cleanse flushes toxins from your body.", true],
    ["ja", "IKIアカデミー — 能動的な健康管理のための講座(3日間リセット・7日間デトックス)。", false],
    ["ja", "ケアの前に、まず体質チェック — 無料診断は13の質問。", false],
    ["ja", "医学的な診断や助言に代わるものではありません。", false],
    ["ja", "このお茶は糖尿病を治します。", true],
    ["vi", "Nội dung không thay thế chẩn đoán hoặc tư vấn y khoa.", false],
    ["vi", "Sản phẩm này chữa bệnh gout sau 7 ngày.", true],
  ];
  let sai = 0;
  for (const [ng, cau, phaiChan] of CA) {
    const d = dinhTuCam(cau, ng);
    const bichan = d.length > 0;
    const ok = bichan === phaiChan;
    if (!ok) sai++;
    console.log(`${ok ? "PASS" : "SAI "} [${ng}] ${phaiChan ? "phải CHẶN" : "phải CHO QUA"} · "${cau.slice(0, 58)}"${bichan ? ` -> ${d[0].slice(0, 60)}` : ""}`);
  }
  console.log(sai ? `\n${sai}/${CA.length} ca SAI — sửa bộ lọc rồi chạy lại.` : `\nĐủ ${CA.length}/${CA.length} ca.`);
  process.exit(sai ? 1 : 0);
}

// ── Chọn bài cần dịch ─────────────────────────────────────────────────────────
const dsVN = fs.readdirSync(path.join(ROOT, "blog")).filter((f) => f.endsWith(".html") && f !== "index.html");
const daCo = new Set(fs.existsSync(path.join(ROOT, NGON, "blog")) ? fs.readdirSync(path.join(ROOT, NGON, "blog")) : []);
let can = SLUG ? [`${SLUG}.html`] : dsVN.filter((f) => !daCo.has(f)).sort().slice(0, LO);
if (!can.length) { console.log(`Không còn bài nào thiếu bản ${NGON.toUpperCase()}.`); process.exit(0); }

// Khuôn: một bài đã có sẵn ở thư mục đích.
const tenKhuon = [...daCo].find((f) => f !== "index.html");
if (!tenKhuon) { console.error(`Chưa có bài ${NGON.toUpperCase()} nào để làm khuôn — dịch tay một bài trước đã.`); process.exit(1); }
const khuon = fs.readFileSync(path.join(ROOT, NGON, "blog", tenKhuon), "utf8");
const khuonMain = layKhoi(khuon, "<main>", "</main>");
if (!khuonMain) { console.error(`Khuôn ${tenKhuon} không có khối <main> — chọn bài khác.`); process.exit(1); }
const slugKhuon = tenKhuon.replace(/\.html$/, "");

console.log(`Dịch sang ${NGON.toUpperCase()} · ${can.length} bài · khuôn: ${tenKhuon}${THU ? " · THỬ (không ghi)" : ""}`);

const SYS = `Bạn dịch bài blog sức khoẻ từ tiếng Việt sang ${TEN_NGON} cho thương hiệu IKI.

LUẬT BẤT DI BẤT DỊCH:
1. Giữ NGUYÊN VẸN mọi thẻ HTML, thuộc tính, class, id, href, src, và mọi đoạn mã. Chỉ dịch phần chữ người đọc thấy, cộng thêm thuộc tính alt và title.
2. Giữ nguyên các neo #anchor trong href kể cả khi chúng viết bằng tiếng Việt không dấu — id đích cũng giữ nguyên, hai bên phải khớp nhau.
3. Sản phẩm là THỰC PHẨM BỔ SUNG, không phải thuốc. TUYỆT ĐỐI KHÔNG dùng: cure, treat, heal, detox, detoxify, cleanse, remedy, diagnose (và tương đương tiếng Nhật: 治療, 治す, 完治, 解毒, デトックス, 診断). Dùng cách nói mô tả: "supports", "may help you feel", "traditionally used for".
4. Không hứa kết quả theo thời gian ("results in 7 days"), không dùng lời chứng bệnh nhân làm bằng chứng.
5. Giọng văn: ấm áp, rõ ràng, như người bạn hiểu biết — không quảng cáo, không thổi phồng.
6. Chỉ trả về HTML. Không thêm lời dẫn, không rào \`\`\`.

SỔ TỪ BẮT BUỘC — dùng đúng cách nói này, đừng tự chọn từ khác:
- Tên khoá học giữ NGUYÊN dạng tên riêng: "3 Ngày Reset" -> "3-Day Reset" / "3日間リセット";
  "7 Ngày Detox" -> "7-Day Detox" / "7日間デトックス". Đây là TÊN, không được diễn giải thành công dụng.
- Bài trắc nghiệm thể tạng: tiếng Anh dùng "free constitution check" hoặc "free quiz";
  tiếng Nhật dùng "無料体質チェック". KHÔNG dùng "diagnosis" / "診断".
- "chăm sóc sức khoẻ chủ động" -> "proactive health care" / "能動的な健康ケア".
- "thực phẩm bổ sung" -> "dietary supplement" / "健康補助食品". KHÔNG dịch thành thuốc hay
  "functional food for treatment".
- Câu miễn trừ cuối bài giữ đúng nghĩa phủ định: "không thay thế chẩn đoán hoặc tư vấn y khoa"
  -> "not a substitute for medical diagnosis or advice" / "医学的な診断や助言に代わるものではありません".`;

let xong = 0, bo = 0;
for (const ten of can) {
  const slug = ten.replace(/\.html$/, "");
  const pVN = path.join(ROOT, "blog", ten);
  if (!fs.existsSync(pVN)) { console.log(`  BỎ ${slug}: không có bản Việt`); bo++; continue; }
  const vn = fs.readFileSync(pVN, "utf8");
  const main = layKhoi(vn, "<main>", "</main>");
  if (!main) { console.log(`  BỎ ${slug}: bản Việt không có khối <main>`); bo++; continue; }

  const tieuDeVN = (/<title>([\s\S]*?)<\/title>/i.exec(vn) || [])[1]?.trim() || slug;
  const moTaVN = (/<meta name="description" content="([\s\S]*?)"/i.exec(vn) || [])[1]?.trim() || "";

  try {
    const raw = await goiClaude(SYS,
      `Dịch sang ${TEN_NGON}. Trả về ĐÚNG định dạng sau, không thêm gì khác:\n\n` +
      `<!--TIEUDE-->\n<tiêu đề đã dịch, dưới 60 ký tự nếu được>\n` +
      `<!--MOTA-->\n<mô tả meta đã dịch, 140-160 ký tự>\n` +
      `<!--MAIN-->\n<toàn bộ khối main đã dịch>\n\n` +
      `--- TIÊU ĐỀ GỐC ---\n${tieuDeVN}\n\n--- MÔ TẢ GỐC ---\n${moTaVN}\n\n--- KHỐI MAIN GỐC ---\n${main.noi}`);

    const tieuDe = (raw.split("<!--TIEUDE-->")[1] || "").split("<!--MOTA-->")[0].trim();
    const moTa = (raw.split("<!--MOTA-->")[1] || "").split("<!--MAIN-->")[0].trim();
    const mainMoi = boRao((raw.split("<!--MAIN-->")[1] || "").trim());

    if (!tieuDe || !moTa || !mainMoi.includes("<main")) throw new Error("mô hình trả sai định dạng");

    // Chốt 2 — đếm thẻ. Lệch quá 5% là mô hình đã nuốt markup.
    const g = demThe(main.noi), m = demThe(mainMoi);
    if (!g || Math.abs(m - g) / g > 0.05) throw new Error(`lệch số thẻ: gốc ${g}, dịch ${m}`);

    // Chốt 1 — cổng từ cấm chạy trên BẢN DỊCH.
    const dinh = [...dinhTuCam(tieuDe + " " + moTa + " " + mainMoi, NGON), ...dinhTuCam(tieuDe + " " + moTa, "vi")];
    if (dinh.length) throw new Error(`dính từ cấm: ${dinh.join(", ")}`);

    // Đắp vào khuôn.
    let out = khuon.slice(0, khuonMain.i) + mainMoi + khuon.slice(khuonMain.j);
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${tieuDe}</title>`);
    out = out.replace(/<meta name="description" content="[\s\S]*?"/i, `<meta name="description" content="${moTa.replace(/"/g, "&quot;")}"`);
    // Mọi chỗ nhắc slug của bài khuôn (canonical, hreflang, og:url, schema) đổi sang slug bài này.
    out = out.split(slugKhuon).join(slug);
    // Ảnh hero: bài dịch nằm sâu hơn một cấp so với bản Việt.
    out = out.replace(/(src|href)="\.\.\/assets\//g, '$1="../../assets/');

    if (THU) { console.log(`  THỬ ${slug}: "${tieuDe}" · ${m} thẻ · ${out.length} ký tự`); xong++; continue; }
    fs.mkdirSync(path.join(ROOT, NGON, "blog"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, NGON, "blog", ten), out, "utf8");
    console.log(`  OK  ${slug} -> ${NGON}/blog/${ten} · "${tieuDe}"`);
    xong++;
  } catch (e) {
    console.log(`  BỎ ${slug}: ${String(e?.message || e).slice(0, 120)}`);
    bo++;
  }
}

console.log(`\nXong ${xong} bài · bỏ ${bo} bài.`);
console.log(`Còn thiếu bản ${NGON.toUpperCase()}: ${dsVN.filter((f) => !fs.existsSync(path.join(ROOT, NGON, "blog", f))).length} bài.`);
if (bo) console.log("Bài BỎ không ghi file — chạy lại lệnh này là máy thử lại đúng những bài đó.");
