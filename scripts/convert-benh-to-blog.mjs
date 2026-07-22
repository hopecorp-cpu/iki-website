// Chuyển 8 file kiến thức bệnh (content-kho/benh-drafts) -> blog-drafts với frontmatter ---json,
// no_product:true (tắt nút mua), category "cam-nang-suc-khoe". Strip dòng # tiêu đề trùng.
import { readFileSync, writeFileSync, existsSync } from "fs";

const BASE = "/Users/NguyenHung/Documents/Claude/Projects/HOPE CORP/website";
const META = [
  { slug: "mau-nhiem-mo", title: "Rối loạn mỡ máu: dấu hiệu, nguyên nhân và khi nào đi khám", seo: "Máu nhiễm mỡ: dấu hiệu, nguyên nhân, khi nào đi khám", kw: "máu nhiễm mỡ", alt: "Thực phẩm tốt cho tim mạch: cá, dầu ô liu, rau củ và các loại hạt", rel: ["gan-nhiem-mo","8-nhom-thuc-pham-lanh-manh","rau-la-xanh-moi-ngay","van-dong-nhe-moi-ngay"] },
  { slug: "gan-nhiem-mo", title: "Gan nhiễm mỡ: dấu hiệu, nguyên nhân và khi nào đi khám", seo: "Gan nhiễm mỡ: dấu hiệu, nguyên nhân, khi nào đi khám", kw: "gan nhiễm mỡ", alt: "Rau xanh, trái cây và nước lọc cho chế độ ăn lành mạnh", rel: ["mau-nhiem-mo","8-nhom-thuc-pham-lanh-manh","an-chay-du-chat-can-bang","duong-va-do-che-bien-san"] },
  { slug: "tang-huyet-ap", title: "Tăng huyết áp: dấu hiệu, nguyên nhân và khi nào đi khám", seo: "Tăng huyết áp: dấu hiệu và khi nào cần đi khám", kw: "tăng huyết áp", alt: "Máy đo huyết áp bên cạnh rau củ và trái cây tươi", rel: ["mau-nhiem-mo","8-nhom-thuc-pham-lanh-manh","van-dong-nhe-moi-ngay","giac-ngu-chat-luong"] },
  { slug: "thieu-mau", title: "Thiếu máu: dấu hiệu, nguyên nhân và khi nào đi khám", seo: "Thiếu máu: dấu hiệu, nguyên nhân và khi nào đi khám", kw: "thiếu máu", alt: "Thực phẩm giàu sắt: rau lá xanh, đậu và trái cây", rel: ["8-nhom-thuc-pham-lanh-manh","rau-la-xanh-moi-ngay","cac-loai-hat-dinh-duong","an-chay-du-chat-can-bang"] },
  { slug: "suy-gian-tinh-mach-chan", title: "Suy giãn tĩnh mạch chân: dấu hiệu và khi nào đi khám", seo: "Suy giãn tĩnh mạch chân: dấu hiệu, khi nào đi khám", kw: "suy giãn tĩnh mạch chân", alt: "Giày đi bộ và chai nước bên lối đi trong công viên", rel: ["van-dong-nhe-moi-ngay","thoi-quen-buoi-sang","tang-huyet-ap"] },
  { slug: "thoai-hoa-khop", title: "Thoái hoá khớp: dấu hiệu, nguyên nhân và khi nào đi khám", seo: "Thoái hoá khớp: dấu hiệu và khi nào cần đi khám", kw: "thoái hoá khớp", alt: "Thảm tập và chai nước trong phòng sáng, vận động nhẹ nhàng", rel: ["van-dong-nhe-moi-ngay","cac-loai-hat-dinh-duong","8-nhom-thuc-pham-lanh-manh"] },
  { slug: "te-bi-chan-tay", title: "Tê bì chân tay: nguyên nhân và khi nào cần đi khám", seo: "Tê bì chân tay: nguyên nhân, khi nào cần đi khám", kw: "tê bì chân tay", alt: "Lối đi bộ trong thiên nhiên với ánh sáng dịu", rel: ["van-dong-nhe-moi-ngay","mau-nhiem-mo","giac-ngu-chat-luong"] },
  { slug: "dau-nua-dau", title: "Đau nửa đầu (Migraine): dấu hiệu và khi nào đi khám", seo: "Đau nửa đầu Migraine: dấu hiệu, khi nào đi khám", kw: "đau nửa đầu", alt: "Không gian yên tĩnh với tách trà ấm, thư giãn dịu nhẹ", rel: ["giac-ngu-chat-luong","giu-tinh-than-can-bang","uong-nuoc-dung-cach-moi-ngay"] },
];

function firstPara(body) {
  const lines = body.split("\n");
  for (const ln of lines) {
    const t = ln.trim();
    if (!t || t.startsWith("#") || t.startsWith("**Bài viết")) continue;
    return t.replace(/\*\*/g, "").replace(/\s+/g, " ").slice(0, 240);
  }
  return "";
}

const plan = JSON.parse(readFileSync(`${BASE}/content-plan.json`, "utf8"));
const TITLE = {};
for (const a of plan.articles) TITLE[a.slug] = a.title;
for (const m of META) TITLE[m.slug] = m.title;

let done = 0;
for (const m of META) {
  const src = `${BASE}/content-kho/benh-drafts/${m.slug}.md`;
  if (!existsSync(src)) { console.log("  ! thiếu nguồn:", m.slug); continue; }
  let raw = readFileSync(src, "utf8").replace(/\r/g, "").trim();
  // bỏ dòng # tiêu đề đầu (tránh trùng h1)
  raw = raw.replace(/^#\s+.*\n+/, "");
  const answer = firstPara(raw);
  const fm = {
    title: m.title,
    seo_title: m.seo,
    slug: m.slug,
    description: `${m.title}. Kiến thức tham khảo về ${m.kw}: dấu hiệu, nguyên nhân, khi nào cần đi khám bác sĩ. Không thay thế thăm khám y khoa.`.slice(0, 158),
    keyword: m.kw,
    category: "cam-nang-suc-khoe",
    date: "2026-07-22",
    updated: "2026-07-22",
    author: "Đội ngũ Health Coach IKI",
    hero_local: `assets/blog/${m.slug}-hero.jpg`,
    hero_alt: m.alt,
    reading_min: Math.max(8, Math.round(raw.split(/\s+/).length / 200)),
    no_product: true,
    answer,
    faq: [],
    related: m.rel.map((s) => ({ title: TITLE[s] || s, url: `${s}.html` })),
  };
  const out = `---json\n${JSON.stringify(fm, null, 2)}\n---\n\n${raw}\n`;
  writeFileSync(`${BASE}/blog-drafts/${m.slug}.md`, out, "utf8");
  console.log("  OK", m.slug, "· no_product · answer", answer.length, "ký tự");
  done++;
}
console.log(`\n=== chuyển ${done}/8 ===`);
