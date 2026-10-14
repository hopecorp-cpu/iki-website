#!/usr/bin/env node
/**
 * sua-chuyen-ngon-ngu.mjs — BỘ CHUYỂN NGÔN NGỮ PHẢI TRỎ ĐÚNG TRANG ĐANG ĐỌC.
 *
 * Vì sao có (13/10/2026, CEO: "rà soát hệ thống khi ấn chuyển đổi ngôn ngữ thì nội dung các trang
 * đều cần đc chuyển đổi đầy đủ đồng nhất, cả phần tiếng Nhật nữa"): web đang có HAI khuôn đầu trang
 * và cả hai đều sai một kiểu khác nhau.
 *   - 11 trang khuôn cũ (10 trang pháp lý + 404) dùng <div class="nav-lang"> với CỜ EMOJI, và cả ba
 *     cờ đều trỏ về /, /en/, /ja/ — khách đang đọc chính sách đổi trả, bấm EN, bị ném về trang chủ.
 *     Cờ emoji còn vi phạm luật "không emoji trong file UI" nên thay bằng chữ VI/EN/JA.
 *   - 10 trang khuôn mới dùng <details class="language-switch">; trang nào đã có bản dịch thì trỏ
 *     đúng, trang nào chưa thì ghi "English · Trang chủ" — trung thực nhưng vẫn là ngõ cụt.
 * Máy này quét CẢ BA cây (gốc, en/, ja/) và viết lại khối chuyển ngôn ngữ theo một luật duy nhất:
 *   có bản dịch -> trỏ thẳng trang đó; chưa có -> trỏ trang chủ thứ tiếng đó và NÓI RÕ là trang chủ.
 * Kèm theo: bổ sung 4 dòng hreflang cho trang nào thiếu, để Google biết ba bản là một trang.
 *
 * Chạy lại được, không gọi API, không dịch chữ:
 *   node scripts/sua-chuyen-ngon-ngu.mjs            (sửa thật)
 *   node scripts/sua-chuyen-ngon-ngu.mjs --thu      (chỉ liệt kê trang sẽ đổi)
 * Chạy lại sau MỖI lần thêm bản dịch mới — nó tự thấy file mới và nối lại đường.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ikihealing.com";
const THU = process.argv.includes("--thu");
const NGONS = ["vi", "en", "ja"];
const NHAN = { vi: "Tiếng Việt", en: "English", ja: "日本語" };
const TRANG_CHU = { vi: "Trang chủ", en: "Home", ja: "ホーム" };

// Trang chỉ có ở bản Việt và KHÔNG định dịch thì bỏ qua (để khỏi dựng đường cụt).
const BO_QUA = new Set([]);

const duongDan = (ngon, ten) => {
  const goc = ten === "index.html" ? "/" : `/${ten}`;
  return ngon === "vi" ? goc : `/${ngon}${goc}`;
};
const coBan = (ngon, ten) => ngon === "vi" || fs.existsSync(path.join(ROOT, ngon, ten));

/** Đích đến của một thứ tiếng: trang cùng tên nếu có, không thì trang chủ thứ tiếng đó. */
function dich(ngon, ten) {
  if (coBan(ngon, ten)) return { href: duongDan(ngon, ten), nhan: NHAN[ngon], that: true };
  return { href: duongDan(ngon, "index.html"), nhan: `${NHAN[ngon]} · ${TRANG_CHU[ngon]}`, that: false };
}

/** Khuôn CŨ: <div class="nav-lang"> — thay cờ emoji bằng chữ, trỏ đúng trang. */
function khuonCu(html, ten, dangXem) {
  const links = NGONS.map((l) => {
    const d = dich(l, ten);
    const nay = l === dangXem;
    return `<a href="${d.href}" lang="${l}" hreflang="${l}"${nay ? ' aria-current="true"' : ""}>${d.nhan}</a>`;
  }).join("");
  const moi = `<div class="nav-lang" aria-label="Language">${links}</div>`;
  return html.replace(/<div class="nav-lang"[^>]*>[\s\S]*?<\/div>/, moi);
}

/** Khuôn MỚI: <div class="language-options"> — giữ nguyên class on / aria-current của khuôn. */
function khuonMoi(html, ten, dangXem) {
  const links = NGONS.map((l) => {
    const d = dich(l, ten);
    const nay = l === dangXem;
    return nay
      ? `<a aria-current="true" class="on" href="${d.href}" lang="${l}">${d.nhan}</a>`
      : `<a class="" href="${d.href}" lang="${l}">${d.nhan}</a>`;
  }).join("");
  const moi = `<div class="language-options">${links}</div>`;
  return html.replace(/<div class="language-options">[\s\S]*?<\/div>/, moi);
}

/** 4 dòng hreflang: chỉ khai thứ tiếng CÓ THẬT, x-default luôn về bản Việt. */
function vaHreflang(html, ten) {
  const dong = NGONS.filter((l) => coBan(l, ten))
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${duongDan(l, ten)}" />`)
    .concat([`<link rel="alternate" hreflang="x-default" href="${SITE}${duongDan("vi", ten)}" />`]);
  const khoi = dong.join("\n  ");
  const sach = html.replace(/\s*<link rel="alternate" hreflang="[^"]*"[^>]*\/?>/g, "");
  if (!/<link rel="canonical"[^>]*\/?>/.test(sach)) return html; // không có canonical thì không đoán chỗ chèn
  return sach.replace(/(<link rel="canonical"[^>]*\/?>)/, `$1\n  ${khoi}`);
}


/**
 * VIỆC THỨ HAI: khách đang đọc bản tiếng Anh thì bấm vào menu phải Ở LẠI tiếng Anh.
 * Trang dịch vẫn mang nguyên liên kết của bản Việt (/hoc-vien.html, /blog/, /shop/), nên đọc xong
 * một trang là khách rơi ngược về tiếng Việt — đúng cái CEO gọi là "chuyển đổi không đồng nhất".
 * Chỉ đổi liên kết TRONG THẺ <a>; <link>/<meta>/canonical/hreflang và dòng ghi chú "bản gốc tiếng
 * Việt" phải giữ nguyên, vì chúng cố ý trỏ sang bản khác.
 */
const MA = { vi: "VI", en: "EN", ja: "JA" };
function coBanDich(ngon, duong) {
  if (ngon === "vi") return true;
  const sach = duong.replace(/[?#].*$/, "");
  const f = sach.endsWith("/") ? path.join(ROOT, ngon, sach, "index.html") : path.join(ROOT, ngon, sach);
  return fs.existsSync(f);
}
function noiLienKetCungTieng(html, ngon) {
  if (ngon === "vi") return html;
  // tách dòng ghi chú bản gốc ra, chèn lại sau — liên kết trong đó phải trỏ bản Việt.
  // Bộ chuyển ngôn ngữ cũng phải giữ nguyên: khuôn vừa viết đúng đường sang từng thứ tiếng,
  // nếu để hàm này sửa tiếp thì nút "Tiếng Việt" trên trang EN bị kéo về chính trang EN.
  const giu = [];
  let t = html.replace(/<p class="locale-note"[\s\S]*?<\/p>/g, (m) => { giu.push(m); return `@@GC${giu.length - 1}@@`; });
  t = t.replace(/<div class="nav-lang"[^>]*>[\s\S]*?<\/div>/g, (m) => { giu.push(m); return `@@GC${giu.length - 1}@@`; });
  t = t.replace(/<div class="language-options">[\s\S]*?<\/div>/g, (m) => { giu.push(m); return `@@GC${giu.length - 1}@@`; });
  t = t.replace(/<a\b[^>]*>/g, (the) => the.replace(/href="(?:https:\/\/ikihealing\.com)?(\/[^"]*)"/, (m, duong) => {
    if (duong.startsWith("/assets/") || duong.startsWith(`/${ngon}/`) || /^\/(en|ja)\//.test(duong)) return m;
    const dich = duong === "/" ? `/${ngon}/` : `/${ngon}${duong}`;
    return coBanDich(ngon, duong) ? `href="${dich}"` : m;
  }));
  return t.replace(/@@GC(\d+)@@/g, (_, k) => giu[Number(k)]);
}
/** Mã hai chữ trên nút chuyển ngôn ngữ của khuôn mới phải khớp thứ tiếng đang xem. */
function vaMaNgon(html, ngon) {
  return html.replace(/(<\/svg>)\s*(VI|EN|JA)\s*(<span aria-hidden="true">)/, `$1 ${MA[ngon]} $3`);
}


/**
 * Trang khuôn cũ nạp styles.css KHÔNG có số bản — khách cũ còn giữ bản CSS cache sẽ thấy ba chữ
 * "Tiếng Việt English 日本語" dính liền nhau (CSS .nav-lang mới thêm 13/10/2026 cho khối chữ thay
 * ba lá cờ emoji). Gắn số bản để trình duyệt tải lại đúng một lần.
 */
const BAN_CSS = "lang-20261013";
const vaBanCss = (html) => html.includes('class="nav-lang"')
  ? html.replace(/href="\/?styles\.css(\?v=[^"]*)?"/, (m) => m.replace(/styles\.css(\?v=[^"]*)?/, `styles.css?v=${BAN_CSS}`))
  : html;


/**
 * VIỆC THỨ BA: nhãn MENU phải giống nhau giữa các trang cùng một thứ tiếng.
 * Mỗi trang dịch một lượt riêng nên mô hình đặt tên khác nhau: ja/index.html ghi "アカデミー" còn
 * ja/du-lieu-su-dung.html giữ nguyên "Học Viện"; "製品" chỗ này, "商品" chỗ kia. Khách đi vài trang
 * là thấy menu đổi chữ — đúng cái CEO gọi là không đồng nhất. Lấy nhãn của trang chủ từng tiếng làm
 * CHUẨN và áp cho mọi trang, nhận diện theo ĐÍCH ĐẾN chứ không theo chữ (chữ đang sai mới phải sửa).
 */
const NHAN_MENU = {
  en: { "/": "Home", "index.html": "Home", "hoc-vien.html": "Academy", "/blog/": "Blog", "cong-dong.html": "Community", "/shop/": "Products", "san-pham.html": "Products", "app.html": "App", "ve-hope.html": "About HOPE CORP" },
  ja: { "/": "ホーム", "index.html": "ホーム", "hoc-vien.html": "アカデミー", "/blog/": "Blog", "cong-dong.html": "コミュニティ", "/shop/": "商品", "san-pham.html": "商品", "app.html": "アプリ", "ve-hope.html": "HOPE CORPについて" },
};
function chuanHoaMenu(html, ngon) {
  const bang = NHAN_MENU[ngon];
  if (!bang) return html;
  const doiKhoi = (khoi) => khoi.replace(/<a\b([^>]*)>([^<]*)<\/a>/g, (m, thuoc, chu) => {
    const h = (/href="([^"]*)"/.exec(thuoc) || [])[1];
    if (!h) return m;
    const sach = h.replace(/^https:\/\/ikihealing\.com/, "").replace(new RegExp(`^/${ngon}`), "") || "/";
    const khoa = sach === "/" ? "/" : (sach === "/blog/" || sach === "/blog" ? "/blog/" : (sach === "/shop/" || sach === "/shop" ? "/shop/" : sach.replace(/^\//, "")));
    const nhan = bang[khoa];
    return nhan && chu.trim() !== nhan ? `<a${thuoc}>${nhan}</a>` : m;
  });
  return html
    .replace(/<ul class="nav-links"[^>]*>[\s\S]*?<\/ul>/, doiKhoi)
    .replace(/<nav id="nav"[^>]*>[\s\S]*?<\/nav>/, doiKhoi);
}

const doiDuoc = [];
for (const ngon of NGONS) {
  const thuMuc = ngon === "vi" ? ROOT : path.join(ROOT, ngon);
  if (!fs.existsSync(thuMuc)) continue;
  for (const ten of fs.readdirSync(thuMuc).filter((f) => f.endsWith(".html")).sort()) {
    if (BO_QUA.has(ten)) continue;
    // Trang chỉ tồn tại ở bản dịch (coming-soon) thì không có bản Việt để đối chiếu — bỏ qua.
    if (ngon !== "vi" && !fs.existsSync(path.join(ROOT, ten))) continue;
    const p = path.join(thuMuc, ten);
    const goc = fs.readFileSync(p, "utf8");
    let t = goc;
    if (t.includes('class="nav-lang"')) t = khuonCu(t, ten, ngon);
    if (t.includes('class="language-options"')) { t = khuonMoi(t, ten, ngon); t = vaMaNgon(t, ngon); }
    t = vaHreflang(t, ten);
    t = noiLienKetCungTieng(t, ngon);
    t = vaBanCss(t);
    t = chuanHoaMenu(t, ngon);
    if (t !== goc) {
      doiDuoc.push(path.relative(ROOT, p));
      if (!THU) fs.writeFileSync(p, t);
    }
  }
}
console.log(doiDuoc.length ? (THU ? "SẼ ĐỔI:\n  " : "ĐÃ ĐỔI:\n  ") + doiDuoc.join("\n  ") : "Không trang nào cần đổi.");
console.log(`${doiDuoc.length} trang.`);
